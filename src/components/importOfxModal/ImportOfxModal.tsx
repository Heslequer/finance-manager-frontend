import { useState, useEffect } from 'react';
import { Modal, Upload, Button, Table, message, Select, Form } from 'antd';
import { UploadOutlined } from '@ant-design/icons';
import { parseOfx, type ParsedOfxTransaction } from '../../services/ofx/ofxParser.service';
import { importOfxTransactions, type OfxImportOptions } from '../../services/ofx/ofxImport.service';
import { expensesApiService } from '../../services/api/expenses/expenses.api';
import { incomesApiService } from '../../services/api/incomes/incomes.api';
import { categoriesApiService } from '../../services/api/categories/categories.api';
import { subcategoriesApiService } from '../../services/api/subcategories/subcategories.api';
import { creditCardsApiService } from '../../services/api/credit-cards/credit-cards.api';
import type { Category } from '../../types/category.interface';
import type { Subcategory } from '../../types/subcategory.interface';
import type { CreditCard } from '../../types/credit-card.interface';

type ImportOfxModalProps = {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  onOpenNotification: (type: string, message: string, description?: string) => void;
  initialCreditCardId?: string;
  showCreditCardSelect?: boolean;
};


const PREVIEW_MAX = 20;

function buildSignature(
  type: 'expense' | 'income',
  description: string,
  amount: number,
  date: string,
): string {
  const desc = (description ?? '').trim();
  const amt = Number(Number(amount).toFixed(2));
  const dt = (date ?? '').slice(0, 10);
  return `${type}|${desc}|${amt}|${dt}`;
}

export default function ImportOfxModal({
  open,
  onClose,
  onSuccess,
  onOpenNotification,
  initialCreditCardId,
  showCreditCardSelect = false,
}: ImportOfxModalProps) {
  const [form] = Form.useForm();
  const [parsed, setParsed] = useState<ParsedOfxTransaction[]>([]);
  const [allFileTransactions, setAllFileTransactions] = useState<ParsedOfxTransaction[]>([]);
  const [loading, setLoading] = useState(false);
  const [importing, setImporting] = useState(false);
  const [expenseCategories, setExpenseCategories] = useState<Category[]>([]);
  const [incomeCategories, setIncomeCategories] = useState<Category[]>([]);
  const [expenseSubcategories, setExpenseSubcategories] = useState<Subcategory[]>([]);
  const [incomeSubcategories, setIncomeSubcategories] = useState<Subcategory[]>([]);
  const [creditCards, setCreditCards] = useState<CreditCard[]>([]);

  const selectedCreditCardId = Form.useWatch('creditCard', form);
  const expenseCategoryId = Form.useWatch('expenseCategoryId', form);
  const incomeCategoryId = Form.useWatch('incomeCategoryId', form);

  useEffect(() => {
    if (!open) return;
    const load = async () => {
      setLoading(true);
      try {
        const [exp, inc, cards] = await Promise.all([
          categoriesApiService.getCategoriesByType('expense'),
          categoriesApiService.getCategoriesByType('income'),
          creditCardsApiService.getAllCreditCards(),
        ]);
        setExpenseCategories(exp ?? []);
        setIncomeCategories(inc ?? []);
        setCreditCards(cards ?? []);
        if (initialCreditCardId) {
          form.setFieldsValue({ creditCard: initialCreditCardId });
        }
      } catch (e) {
        message.error('Error loading categories and credit cards.');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [open, initialCreditCardId, form]);

  useEffect(() => {
    if (!expenseCategoryId) {
      setExpenseSubcategories([]);
      form.setFieldsValue({ expenseSubcategoryId: undefined });
      return;
    }
    subcategoriesApiService.getSubcategoriesByCategoryId(expenseCategoryId).then((s) => {
      setExpenseSubcategories(s ?? []);
      form.setFieldsValue({ expenseSubcategoryId: undefined });
    });
  }, [expenseCategoryId, form]);

  useEffect(() => {
    if (!incomeCategoryId) {
      setIncomeSubcategories([]);
      form.setFieldsValue({ incomeSubcategoryId: undefined });
      return;
    }
    subcategoriesApiService.getSubcategoriesByCategoryId(incomeCategoryId).then((s) => {
      setIncomeSubcategories(s ?? []);
      form.setFieldsValue({ incomeSubcategoryId: undefined });
    });
  }, [incomeCategoryId, form]);

  useEffect(() => {
    if (allFileTransactions.length === 0) {
      setParsed([]);
      return;
    }

    let active = true;

    const filterDuplicates = async () => {
      try {
        const [existingExpenses, existingIncomes] = await Promise.all([
          expensesApiService.getAllExpensesByUserId(''),
          incomesApiService.getAllIncomesByUserId(''),
        ]);

        if (!active) return;

        const existingSignatures = new Set<string>();
        for (const e of existingExpenses) {
          existingSignatures.add(
            buildSignature('expense', e.description ?? '', e.amount, e.date ?? ''),
          );
        }
        for (const i of existingIncomes) {
          existingSignatures.add(
            buildSignature('income', i.description ?? '', i.amount, i.date ?? ''),
          );
        }

        const filtered = allFileTransactions.filter((t) => {
          const type = t.isCredit ? 'income' : 'expense';
          const sig = buildSignature(type, t.description, t.amount, t.date);
          return !existingSignatures.has(sig);
        });

        const ignored = allFileTransactions.length - filtered.length;
        if (ignored > 0) {
          message.info(`${ignored} duplicate transaction(s) ignored (already in system).`);
        }
        setParsed(filtered);
        if (filtered.length === 0) {
          message.info('All transactions from this file already exist.');
        }
      } catch (e) {
        if (!active) return;
        const msg = e instanceof Error ? e.message : 'Error filtering duplicates.';
        message.error(msg);
      }
    };

    filterDuplicates();

    return () => {
      active = false;
    };
  }, [allFileTransactions]);

  const handleFile = async (file: File) => {
    setParsed([]);
    try {
      const text = await file.text();
      const list = await parseOfx(text);
      if (list.length === 0) {
        message.info('No transactions found in file.');
        return false;
      }
      setAllFileTransactions(list);
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Error reading OFX file.';
      message.error(msg);
      onOpenNotification('error', 'Error importing OFX', msg);
    }
    return false;
  };

  const resetModalState = () => {
    setAllFileTransactions([]);
    setParsed([]);
    form.resetFields();
    if (initialCreditCardId) {
      form.setFieldsValue({ creditCard: initialCreditCardId });
    }
  };

  const onFinish = async (values: any) => {
    if (parsed.length === 0) return;
    setImporting(true);
    try {
      const options: OfxImportOptions = {
        expenseCategoryId: values.expenseCategoryId ?? null,
        expenseSubcategoryId: values.expenseSubcategoryId ?? null,
        incomeCategoryId: values.incomeCategoryId ?? null,
        incomeSubcategoryId: values.incomeSubcategoryId ?? null,
        creditCardId: values.creditCard ?? null,
      };
      const { imported, failed, errors } = await importOfxTransactions(parsed, options);
      if (failed > 0 && errors.length > 0) {
        onOpenNotification('warning', `${imported} imported, ${failed} failed`, errors.slice(0, 5).join('; '));
      } else {
        onOpenNotification('success', `${imported} transactions imported successfully.`);
      }
      resetModalState();
      onSuccess();
      onClose();
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Error importing.';
      onOpenNotification('error', 'Error importing OFX', msg);
    } finally {
      setImporting(false);
    }
  };

  const handleClose = () => {
    resetModalState();
    onClose();
  };

  const expenses = parsed.filter((p) => !p.isCredit).length;
  const incomes = parsed.filter((p) => p.isCredit).length;

  const cols = [
    { title: 'Date', dataIndex: 'date', key: 'date', width: 110 },
    { title: 'Amount', dataIndex: 'amount', key: 'amount', width: 100, render: (v: number) => `R$ ${v.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}` },
    { title: 'Description', dataIndex: 'description', key: 'description', ellipsis: true },
    { title: 'Type', dataIndex: 'isCredit', key: 'type', width: 90, render: (c: boolean) => (c ? 'Income' : 'Expense') },
  ];

  const dataSource = parsed.slice(0, PREVIEW_MAX).map((p, i) => ({ ...p, key: i }));

  return (
    <Modal
      title="Import OFX"
      open={open}
      onCancel={handleClose}
      footer={[
        <Button key="cancel" onClick={handleClose}>Cancel</Button>,
        <Button
          key="import"
          type="primary"
          loading={importing}
          disabled={parsed.length === 0}
          htmlType="submit"
          form="import-ofx-form"
        >
          Import
        </Button>,
      ]}
      width={640}
      destroyOnHidden
    >
      <Form
        form={form}
        onFinish={onFinish}
        layout="vertical"
        id="import-ofx-form"
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div>
            <div style={{ marginBottom: 8 }}>File</div>
            <Upload accept=".ofx,.qfx" beforeUpload={handleFile} showUploadList={false} maxCount={1}>
              <Button icon={<UploadOutlined />}>Select .OFX or .QFX file</Button>
            </Upload>
          </div>

          {showCreditCardSelect && (
            <div className="w-50">
              <Form.Item
                name="creditCard"
                label="Credit Card"
                rules={[{ required: true, message: 'Please select a credit card.' }]}
              >
                <Select
                  placeholder="Select Credit Card"
                  allowClear
                  style={{ width: '100%' }}
                  loading={loading}
                  options={creditCards.map((c) => ({
                    value: c.id,
                    label: `${c.card_name} (${c.bank_name})`,
                  }))}
                />
              </Form.Item>
            </div>
          )}

          {parsed.length > 0 && (
            <>
              <div>
                <strong>{parsed.length} transactions</strong> ({expenses} expenses, {incomes} incomes)
              </div>
              <Table
                columns={cols}
                dataSource={dataSource}
                pagination={false}
                size="small"
                scroll={{ y: 200 }}
              />
              {parsed.length > PREVIEW_MAX && (
                <div style={{ color: '#666', fontSize: 12 }}>and {parsed.length - PREVIEW_MAX} more transactions</div>
              )}
            </>
          )}

          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div>
              <div style={{ marginBottom: 4, fontWeight: 500 }}>Expenses (negative amount) — optional</div>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                <Form.Item name="expenseCategoryId" style={{ marginBottom: 0 }}>
                  <Select
                    placeholder="Category"
                    allowClear
                    style={{ minWidth: 160 }}
                    loading={loading}
                    options={expenseCategories.map((c) => ({ value: c.id, label: c.name }))}
                  />
                </Form.Item>
                <Form.Item name="expenseSubcategoryId" style={{ marginBottom: 0 }}>
                  <Select
                    placeholder="Subcategory"
                    allowClear
                    style={{ minWidth: 160 }}
                    options={expenseSubcategories.map((s) => ({ value: s.id, label: s.name }))}
                    disabled={!expenseCategoryId}
                  />
                </Form.Item>
              </div>
            </div>
            {!showCreditCardSelect && (
              <div>
                <div style={{ marginBottom: 4, fontWeight: 500 }}>Incomes (positive amount) — optional</div>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  <Form.Item name="incomeCategoryId" style={{ marginBottom: 0 }}>
                    <Select
                      placeholder="Category"
                      allowClear
                      style={{ minWidth: 160 }}
                      loading={loading}
                      options={incomeCategories.map((c) => ({ value: c.id, label: c.name }))}
                    />
                  </Form.Item>
                  <Form.Item name="incomeSubcategoryId" style={{ marginBottom: 0 }}>
                    <Select
                      placeholder="Subcategory"
                      allowClear
                      style={{ minWidth: 160 }}
                      options={incomeSubcategories.map((s) => ({ value: s.id, label: s.name }))}
                      disabled={!incomeCategoryId}
                    />
                  </Form.Item>
                </div>
              </div>
            )}
          </div>
        </div>
      </Form>
    </Modal>
  );
}
