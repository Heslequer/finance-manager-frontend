import './sidebar.scss'
import React from 'react';
import { ConfigProvider, Layout, Menu, theme} from 'antd';
import type { MenuProps } from 'antd';
import { UnorderedListOutlined, HomeOutlined, BarChartOutlined, TagOutlined } from '@ant-design/icons';
import { useLocation, useNavigate } from 'react-router-dom';
import { useState } from 'react';
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
 
const SIDEBAR_EXPANDED_KEY = 'sidebarExpanded';

export default function Sidebar({onOpenDashboardPage: _onOpenDashboardPage, onOpenCategoriesPage: _onOpenCategoriesPage }: SidebarProps) {
    const [collapsed, setCollapsed] = useState(() => sessionStorage.getItem(SIDEBAR_EXPANDED_KEY) === 'true' ? false : true);
    const navigate = useNavigate();
    const location = useLocation();
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
                sessionStorage.setItem(SIDEBAR_EXPANDED_KEY, 'true');
                navigate(items[index].key);
            },
          };
        },
      );
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
              onMouseEnter={() => {
                setCollapsed(false);
                sessionStorage.setItem(SIDEBAR_EXPANDED_KEY, 'true');
              }}
              onMouseLeave={() => {
                setCollapsed(true);
                sessionStorage.setItem(SIDEBAR_EXPANDED_KEY, 'false');
              }}
          >
            <Menu
                mode="inline"
                selectedKeys={[location.pathname]}
                defaultOpenKeys={['sub1']}
                style={{ height: '100%', borderInlineEnd: 0, }}
                items={items2}
            />
          </Sider>
          </ConfigProvider>
        </>

    )
}