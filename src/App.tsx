import { BrowserRouter } from 'react-router-dom'
import './styles/main.scss'
import AppRoutes from './routes/appRoutes'
import { notification, Space  } from 'antd'
type NotificationType = 'success' | 'info' | 'warning' | 'error';

function App() {
  const openNotificationWithIcon = (type: string, message: string, description?: string) => {
    api[type as NotificationType]({
      message: message,
      description: description,
    });
  };
  const [api, contextHolder] = notification.useNotification();
  return (
    <>
      {contextHolder}
        {/* <button onClick={() => openNotificationWithIcon('success')}>Success</button> */}
        <BrowserRouter>
          <AppRoutes openNotification={ (type: string, message: string, description?: string) => openNotificationWithIcon(type, message, description)} />
        </BrowserRouter>
    </>
  )
}

export default App
