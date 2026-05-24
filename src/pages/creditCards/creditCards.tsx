import './creditCards.scss'
import { Layout, ConfigProvider, Drawer, Button } from 'antd';
import { Content } from 'antd/es/layout/layout';
import Sidebar from '../../components/sidebar/sidebar';
import { useNavigate } from 'react-router-dom';
import { CreditCardOutlined, DollarOutlined, RiseOutlined } from '@ant-design/icons';
import { useState } from 'react';
import NewCardDrawer from './newCreditCardDrawer/newCreditCard';

export default function Reports() {
  const [open, setOpen] = useState(false);
  
  const showDrawer = () => {
    setOpen(true);
  };

  const onClose = () => {
    setOpen(false);
  };
  const navigate = useNavigate();
  return (
  <>
    <Layout style={{ minHeight: "100vh" }}>
      <Sidebar onOpenDashboardPage={() => navigate('/reports')} onOpenCategoriesPage={() => navigate('/categories')} />
      <Layout style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
        <ConfigProvider
          theme={{
            components: {
              Spin: {
                dotSizeLG: 50,
              },
            },
          }}
        >
          <Content>
            <Drawer title="New Card" open={open} onClose={onClose} width={500}>
              <NewCardDrawer />
            </Drawer>
            {/* {isIncomeModalOpen && (
              <NewIncomeModal onClose={() => setIsIncomeModalOpen(false)} income={null}>
              </NewIncomeModal>
            )}
            {isCategoryModalOpen && (
              <NewCategoryModal onClose={() => setIsCategoryModalOpen(false)} uptadeCategories={() => {}}>
              </NewCategoryModal>
            )} */}
            <div className="flex p-5">
              <div className="main-content flex-column gap-2" style={{ height: '100%'}}>
                <div className='flex justify-between'>
                  <div className='flex-column ml-2 mb-2'>
                    <h4>Credit Cards</h4>
                    <p>Manage your credit cards and track your spending.</p>
                  </div>
                  <Button type='primary' onClick={showDrawer}>New Card</Button>
                </div>

                <div className='flex justify-between gap-3'>
                  {/* Total Limit */}
                  <div className='py-4 px-4 flex-start gap-3 border-blue-300 border-2 rounded-3xl grow'>
                    <div className='p-2 bg-blue-100 rounded-2xl'>
                      <CreditCardOutlined style={{ color: '#155DFC', fontSize: '45px' }}/>
                    </div>
                    <div className='flex-column gap-0.5'>
                      <p className='text-lg font-semibold'>Total Limit</p>
                      <p className='text-3xl font-bold text-blue-500'>R$ 10,00.00</p>
                      <p className='text-lg'>Active Cards: 2</p>
                    </div>
                  </div>
                  {/* Available Limit */}
                  <div className='py-4 px-4 flex-start gap-3 border-green-300 border-2 rounded-3xl grow'>
                  <div className='p-2 bg-green-100 rounded-2xl'>
                  <RiseOutlined style={{ color: '#00A63E', fontSize: '45px' }}/>
                    </div>
                    <div className='flex-column gap-0.5'>
                      <p className='text-lg font-semibold'>Available Limit</p>
                      <p className='text-3xl font-bold text-green-500'>R$ 10,00.00</p>
                      <p className='text-lg'>20% of the total limit</p>
                    </div>
                  </div>

                  {/* Total Spent */}
                  <div className='py-4 px-4 flex-start gap-3 border-red-300 border-2 rounded-3xl grow'>
                    <div className='p-2 bg-red-100 rounded-2xl'>
                      <DollarOutlined style={{ color: '#E7000B', fontSize: '45px' }}/>
                    </div>
                    <div className='flex-column gap-0.5'>
                      <p className='text-lg font-semibold'>Total Spent</p>
                      <p className='text-3xl font-bold text-red-500'>R$ 10,00.00</p>
                      <p className='text-lg'>Cards used: 2</p>
                    </div>
                  </div>
                </div>
                {/* Active Cards */}
                <div className='mt-2 flex-column p-3 justify-between gap-2 border-1 rounded-2xl border-black/20'>
                  <h5>Active Cards</h5>
                  <div className='flex-center gap-3'>

                    <div className='py-2 px-4 bg-blue-100 flex-column gap-2 rounded-3xl grow'>
                      <div className='flex-column'>
                        <p className="text-lg">active</p>
                        <p className="text-2xl font-bold">Nubank</p>
                      </div>
                      <div className='flex-column gap-2'>
                        <div className='flex-center gap-2'>
                        <p className='text-2xl mt-2'>**** **** **** </p>
                        <p className='text-2xl'>5454</p>
                        </div>
                        <p className='text-md text-right'>Valid Thru: 05/2026</p>
                      </div>
                    </div>

                    <div className='py-2 px-4 bg-blue-100 flex-column gap-2 rounded-3xl grow'>
                      <div className='flex-column'>
                        <p className="text-lg">active</p>
                        <p className="text-2xl font-bold">Nubank</p>
                      </div>
                      <div className='flex-column gap-2'>
                        <div className='flex-center gap-2'>
                        <p className='text-2xl mt-2'>**** **** **** </p>
                        <p className='text-2xl'>5454</p>
                        </div>
                        <p className='text-md text-right'>Valid Thru: 05/2026</p>
                      </div>
                    </div>

                    <div className='py-2 px-4 bg-blue-100 flex-column gap-2 rounded-3xl grow'>
                      <div className='flex-column'>
                        <p className="text-lg">active</p>
                        <p className="text-2xl font-bold">Nubank</p>
                      </div>
                      <div className='flex-column gap-2'>
                        <div className='flex-center gap-2'>
                        <p className='text-2xl mt-2'>**** **** **** </p>
                        <p className='text-2xl'>5454</p>
                        </div>
                        <p className='text-md text-right'>Valid Thru: 05/2026</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </Content>
        </ConfigProvider>
      </Layout>
    </Layout>
  </>)
}