import './sidebar.scss'
import React from 'react';
import { ConfigProvider, Layout, Menu, theme} from 'antd';
import type { MenuProps } from 'antd';
import { UnorderedListOutlined, HomeOutlined, BarChartOutlined, PlusCircleOutlined, TagOutlined } from '@ant-design/icons';
import { useLocation, useNavigate } from 'react-router-dom';
import { useState } from 'react';
const { Sider } = Layout;
type SidebarProps = {
    onOpenDashboardPage: () => void;
    onOpenCategoriesPage: () => void;
};
  const items = [{key: "/" , label: "Home"},
    {key: "/dashboard" , label: "Dashboard"},
    {key: "/add-transaction" , label: "Add transaction"},
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
    const {
        token: { colorBgContainer},
      } = theme.useToken();
      const items2: MenuProps['items'] = [HomeOutlined, BarChartOutlined, PlusCircleOutlined, UnorderedListOutlined, TagOutlined ].map(
        (icon, index) => {      
          return {
            key: items[index].key,
            icon: React.createElement(icon),
            label: items[index].label,
            onClick: () => {
                navigate(items[index].key);
                // setSelectedKey(items[index].key);
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
                style={{ background: colorBgContainer }} 
                collapsed={collapsed} 
                onMouseEnter={() => setCollapsed(false)}
                onMouseLeave={() => setCollapsed(true)}
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