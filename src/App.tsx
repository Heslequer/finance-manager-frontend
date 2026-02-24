import { BrowserRouter } from 'react-router-dom'
import './styles/main.scss'
import AppRoutes from './routes/appRoutes'
import { notification } from 'antd'
import { ConfigProvider } from 'antd'
import React, { useEffect } from 'react'
import { authService } from './services/auth/auth.service'
import { supabase } from './lib/supabase'

type NotificationType = 'success' | 'info' | 'warning' | 'error';

const App:React.FC = () => {
  useEffect(() => {
    const syncUserOnSession = async () => {
      try {
        await authService.ensureUserInPublicTable();
      } catch {
        // Failure should not block the app
      }
    };

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (session && (event === 'SIGNED_IN' || event === 'INITIAL_SESSION')) {
          syncUserOnSession(); // no await: does not block login flow
        }
      }
    );

    return () => subscription.unsubscribe();
  }, []);
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
