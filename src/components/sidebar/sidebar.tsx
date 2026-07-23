import './sidebar.scss'
import React from 'react';
import { ConfigProvider, Layout, Menu } from 'antd';
import logo from '../../assets/logo-no-background.svg';
import type { MenuProps } from 'antd';
import { UnorderedListOutlined, BarChartOutlined, TagOutlined, LogoutOutlined, CreditCardOutlined } from '@ant-design/icons';
import { useLocation, useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
const { Sider } = Layout;
type SidebarProps = {
  onOpenDashboardPage: () => void;
  onOpenCategoriesPage: () => void;
};
const items = [
  // {key: "/" , label: "Home"},
  { key: "/reports", label: "Reports" },
  { key: "/transactions", label: "Transactions" },
  { key: "/categories", label: "Categories" },
  { key: "/credit-cards", label: "Credit Cards" },
]

export default function Sidebar({ onOpenDashboardPage: _onOpenDashboardPage, onOpenCategoriesPage: _onOpenCategoriesPage }: SidebarProps) {
  const navigate = useNavigate();
  const location = useLocation();

  const items2: MenuProps['items'] = [/*HomeOutlined,*/ BarChartOutlined, UnorderedListOutlined, TagOutlined,
    CreditCardOutlined
  ].map(
    (icon, index) => {
      return {
        key: items[index].key,
        icon: React.createElement(icon),
        label: items[index].label,
        onClick: () => {
          navigate(items[index].key);
        },
      };
    },
  );

  const logoutItem: MenuProps['items'] = [
    {
      key: 'logout',
      icon: React.createElement(LogoutOutlined),
      label: 'Log out',
      onClick: async () => {
        await supabase.auth.signOut();
        navigate('/login');
      },
    },
  ];
  return (
    <>
      <ConfigProvider
        theme={{
          token: {
            fontSize: 18,
          },
          components:{
            Menu:{
              darkItemHoverBg:"rgba(255, 255, 255, 0.11)",
              darkItemSelectedBg:"rgba(255, 255, 255, 0.11)",
            }
          }
        }}
      >

        <Sider
          width={250}
          className="sidebar-fixed !bg-midnight-navy rounded-l-3xl"
          collapsed={true}
        >
          <div className='flex flex-col h-full px-2 py-3 gap-5'>
            <div className='h-13 flex justify-center bg-white/11 rounded-2xl'>
              <img
                className='brightness-0 invert'
                width={45}
                alt='logo'
                src={logo}
              />
            </div>
            <Menu
              mode="inline"
              theme="dark"
              selectedKeys={[location.pathname]}
              defaultOpenKeys={['1']}
              style={{ flex: 1, borderInlineEnd: 0, background: 'transparent' }}
              items={items2}
            />
            <Menu
              mode="inline"
              theme="dark"
              style={{ borderInlineEnd: 0, borderTop: '1px solid rgba(255, 255, 255, 0.15)', background: 'transparent' }}
              items={logoutItem}
            />
          </div>
        </Sider>
      </ConfigProvider>
    </>

  )
}