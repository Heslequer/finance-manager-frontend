import { BrowserRouter } from 'react-router-dom'
import './styles/main.scss'
import AppRoutes from './routes/appRoutes'
import { notification } from 'antd'
import { ConfigProvider, theme } from 'antd'
import React from 'react'
type NotificationType = 'success' | 'info' | 'warning' | 'error';

const App:React.FC = () => {
  const openNotificationWithIcon = (type: string, message: string, description?: string) => {
    api[type as NotificationType]({
      message: message,
      description: description,
    });
  };
  const [api, contextHolder] = notification.useNotification();
  return (
    <ConfigProvider
      theme={{
        token: {
          "colorPrimary": "#1677ff",
          "colorInfo": "#1677ff"
        },
      }}
    >
      {contextHolder}
        {/* <button onClick={() => openNotificationWithIcon('success')}>Success</button> */}
        <BrowserRouter>
          <AppRoutes openNotification={ (type: string, message: string, description?: string) => openNotificationWithIcon(type, message, description)} />
        </BrowserRouter>
    </ConfigProvider>
  )
}

export default App
