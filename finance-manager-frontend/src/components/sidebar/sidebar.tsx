import './sidebar.scss'
import React, { useState, useEffect } from 'react';
import { ConfigProvider, Layout, Menu, theme} from 'antd';
import type { MenuProps } from 'antd';
import { UnorderedListOutlined, HomeOutlined, BarChartOutlined, TagOutlined, LogoutOutlined } from '@ant-design/icons';
import { useLocation, useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
const { Sider } = Layout;
type SidebarProps = {
    onOpenDashboardPage: () => void;
    onOpenCategoriesPage: () => void;
};
  const items = [{key: "/" , label: "Home"},
    {key: "/dashboard" , label: "Dashboard"},
    {key: "/transactions" , label: "Transactions"},
    {key: "/categories" , label: "Categories"},
  ] 
//   ["Home", "Dashboard", "Add transaction", "Categories"];
  // const pages = ["/", "/dashboard", "/add-transaction", "/categories"];
//   const navigate = useNavigate();
 
export default function Sidebar({onOpenDashboardPage: _onOpenDashboardPage, onOpenCategoriesPage: _onOpenCategoriesPage }: SidebarProps) {
    const [collapsed, setCollapsed] = useState(true);
    const navigate = useNavigate();
    const location = useLocation();

    useEffect(() => {
        setCollapsed(true);
    }, [location.pathname]);
    const {
        token: { colorBgContainer},
      } = theme.useToken();
      const items2: MenuProps['items'] = [HomeOutlined, BarChartOutlined, UnorderedListOutlined, TagOutlined ].map(
        (icon, index) => {      
          return {
            key: items[index].key,
            icon: React.createElement(icon),
            label: items[index].label,
            onClick: () => {
                setCollapsed(true);
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
            setCollapsed(true);
            await supabase.auth.signOut();
            navigate('/login');
          },
        },
      ];
    return (
        <>
          <ConfigProvider
              theme={{
                  token:{
                      fontSize: 18,
                  }
              }}
          >

          <Sider 
              width={250} 
              className="sidebar-fixed"
              style={{ background: colorBgContainer }} 
              collapsed={collapsed} 
              onMouseEnter={() => setCollapsed(false)}
              onMouseLeave={() => setCollapsed(true)}
          >
            <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
              <Menu
                  mode="inline"
                  selectedKeys={[location.pathname]}
                  defaultOpenKeys={['sub1']}
                  style={{ flex: 1, borderInlineEnd: 0 }}
                  items={items2}
              />
              <Menu
                  mode="inline"
                  style={{ borderInlineEnd: 0, borderTop: '1px solid rgba(5, 5, 5, 0.06)' }}
                  items={logoutItem}
              />
            </div>
          </Sider>
          </ConfigProvider>
        </>

    )
}