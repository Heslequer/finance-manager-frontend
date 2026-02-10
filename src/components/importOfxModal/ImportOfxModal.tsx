import { useState, useEffect } from 'react';
import { Modal, Upload, Button, Table, message, Select } from 'antd';
import { UploadOutlined } from '@ant-design/icons';
import { parseOfx, type ParsedOfxTransaction } from '../../services/ofx/ofxParser.service';
import { importOfxTransactions, type OfxImportOptions } from '../../services/ofx/ofxImport.service';
import { CategoriesService } from '../../services/supabase/categories/categories.service';
import { SubcategoriesService } from '../../services/supabase/subcategories/subcategories.service';
import type { Category } from '../../services/supabase/categories/categories.interface';
import type { Subcategory } from '../../services/supabase/subcategories/subcategories.interface';

type ImportOfxModalProps = {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  onOpenNotification: (type: string, message: string, description?: string) => void;
};

const categoriesService = new CategoriesService();
const subcategoriesService = new SubcategoriesService();

const PREVIEW_MAX = 20;

export default function ImportOfxModal({ open, onClose, onSuccess, onOpenNotification }: ImportOfxModalProps) {
  const [parsed, setParsed] = useState<ParsedOfxTransaction[]>([]);
  const [loading, setLoading] = useState(false);
  const [importing, setImporting] = useState(false);
  const [expenseCategories, setExpenseCategories] = useState<Category[]>([]);
  const [incomeCategories, setIncomeCategories] = useState<Category[]>([]);
  const [expenseSubcategories, setExpenseSubcategories] = useState<Subcategory[]>([]);
  const [incomeSubcategories, setIncomeSubcategories] = useState<Subcategory[]>([]);
  const [expenseCategoryId, setExpenseCategoryId] = useState<string | undefined>(undefined);
  const [expenseSubcategoryId, setExpenseSubcategoryId] = useState<string | undefined>(undefined);
  const [incomeCategoryId, setIncomeCategoryId] = useState<string | undefined>(undefined);
  const [incomeSubcategoryId, setIncomeSubcategoryId] = useState<string | undefined>(undefined);

  useEffect(() => {
    if (!open) return;
    const load = async () => {
      setLoading(true);
      try {
        const [exp, inc] = await Promise.all([
          categoriesService.getCategoriesByType('expense'),
          categoriesService.getCategoriesByType('income'),
        ]);
        setExpenseCategories(exp ?? []);
        setIncomeCategories(inc ?? []);
      } catch (e) {
        message.error('Error loading categories.');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [open]);

  useEffect(() => {
    if (!expenseCategoryId) {
      setExpenseSubcategories([]);
      setExpenseSubcategoryId(undefined);
      return;
    }
    subcategoriesService.getSubcategoriesByCategoryId(expenseCategoryId).then((s) => {
      setExpenseSubcategories(s ?? []);
      setExpenseSubcategoryId(undefined);
    });
  }, [expenseCategoryId]);

  useEffect(() => {
    if (!incomeCategoryId) {
      setIncomeSubcategories([]);
      setIncomeSubcategoryId(undefined);
      return;
    }
    subcategoriesService.getSubcategoriesByCategoryId(incomeCategoryId).then((s) => {
      setIncomeSubcategories(s ?? []);
      setIncomeSubcategoryId(undefined);
    });
  }, [incomeCategoryId]);

  const handleFile = async (file: File) => {
    setParsed([]);
    try {
      const text = await file.text();
      const list = await parseOfx(text);
      setParsed(list);
      if (list.length === 0) {
        message.info('No transactions found in file.');
      }
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Error reading OFX file.';
      message.error(msg);
      onOpenNotification('error', 'Error importing OFX', msg);
    }
    return false;
  };

  const handleImport = async () => {
    if (parsed.length === 0) return;
    setImporting(true);
    try {
      const options: OfxImportOptions = {
        expenseCategoryId: expenseCategoryId ?? null,
        expenseSubcategoryId: expenseSubcategoryId ?? null,
        incomeCategoryId: incomeCategoryId ?? null,
        incomeSubcategoryId: incomeSubcategoryId ?? null,
      };
      const { imported, failed, errors } = await importOfxTransactions(parsed, options);
      if (failed > 0 && errors.length > 0) {
        onOpenNotification('warning', `${imported} imported, ${failed} failed`, errors.slice(0, 5).join('; '));
      } else {
        onOpenNotification('success', `${imported} transactions imported successfully.`);
      }
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
    setParsed([]);
    setExpenseCategoryId(undefined);
    setExpenseSubcategoryId(undefined);
    setIncomeCategoryId(undefined);
    setIncomeSubcategoryId(undefined);
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
        <Button key="import" type="primary" loading={importing} disabled={parsed.length === 0} onClick={handleImport}>
          Import
        </Button>,
      ]}
      width={640}
      destroyOnClose
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <div>
          <div style={{ marginBottom: 8 }}>File</div>
          <Upload accept=".ofx,.qfx" beforeUpload={handleFile} showUploadList={false} maxCount={1}>
            <Button icon={<UploadOutlined />}>Select .OFX or .QFX file</Button>
          </Upload>
        </div>

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
              <Select
                placeholder="Category"
                allowClear
                style={{ minWidth: 160 }}
                loading={loading}
                value={expenseCategoryId || undefined}
                onChange={setExpenseCategoryId}
                options={expenseCategories.map((c) => ({ value: c.id, label: c.name }))}
              />
              <Select
                placeholder="Subcategory"
                allowClear
                style={{ minWidth: 160 }}
                value={expenseSubcategoryId || undefined}
                onChange={setExpenseSubcategoryId}
                options={expenseSubcategories.map((s) => ({ value: s.id, label: s.name }))}
                disabled={!expenseCategoryId}
              />
            </div>
          </div>
          <div>
            <div style={{ marginBottom: 4, fontWeight: 500 }}>Incomes (positive amount) — optional</div>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              <Select
                placeholder="Category"
                allowClear
                style={{ minWidth: 160 }}
                loading={loading}
                value={incomeCategoryId || undefined}
                onChange={setIncomeCategoryId}
                options={incomeCategories.map((c) => ({ value: c.id, label: c.name }))}
              />
              <Select
                placeholder="Subcategory"
                allowClear
                style={{ minWidth: 160 }}
                value={incomeSubcategoryId || undefined}
                onChange={setIncomeSubcategoryId}
                options={incomeSubcategories.map((s) => ({ value: s.id, label: s.name }))}
                disabled={!incomeCategoryId}
              />
            </div>
          </div>
        </div>
      </div>
    </Modal>
  );
}
