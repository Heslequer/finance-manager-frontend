import { useState } from 'react';
import './login.scss';
import { Button, Checkbox, Form, Input, message } from 'antd';
import { MailOutlined, LockOutlined, EyeInvisibleOutlined, EyeOutlined, RightOutlined, WalletOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { authService } from '../../services/auth/auth.service';

export default function LoginPage() {
    const navigate = useNavigate();
    const [form] = Form.useForm();
    const [loading, setLoading] = useState(false);
    const [messageApi, contextHolder] = message.useMessage();

    const onFinish = async (values: { email: string; password: string }) => {
        setLoading(true);

        const hideLoading = messageApi.loading('Logging in ...', 0);

        try {
            await authService.signInWithEmail(values);

            hideLoading();

            messageApi.success('Login successful!');
            navigate('/dashboard');
        } catch (error: unknown) {
            hideLoading();
            messageApi.error(
                error instanceof Error ? error.message : 'Error logging in. Please check your credentials.'
            );
        } finally {
            setLoading(false);
        }
    };

    return (
        <>
            {contextHolder}
            <div className="login-page flex-center">
            <div className="login-card flex">
                <div className="login-card-left flex-column p-6">
                    <div className="login-branding flex mb-6">
                        <WalletOutlined className="login-brand-icon h5 mr-2" />
                        <span className="login-brand-text h5 font-weight-600">FinancePro</span>
                    </div>
                    <h3 className="login-tagline h4 font-weight-700 mb-3">
                        Take full control of your financial life.
                    </h3>
                    <p className="login-description p3 font-weight-300 mb-8">
                        Manage expenses, set goals and track your progress in a simple and smart way.
                    </p>
                    <div className="login-stats flex gap-3">
                        <div className="login-stat-box flex-column p-3">
                            <span className="login-stat-value h4 font-weight-700">85%</span>
                            <span className="login-stat-label p5">Average savings</span>
                        </div>
                        <div className="login-stat-box flex-column p-3">
                            <span className="login-stat-value h4 font-weight-700">+10k</span>
                            <span className="login-stat-label p5">Active users</span>
                        </div>
                    </div>
                </div>

                <div className="login-card-right flex-column p-6">
                    <h4 className="h4 font-weight-600 mb-1">Welcome back!</h4>
                    <p className="p4 font-weight-300 mb-5" style={{ color: '#666' }}>
                        Enter your credentials to access your account.
                    </p>

                    <Form
                        form={form}
                        layout="vertical"
                        onFinish={onFinish}
                        requiredMark={false}
                    >
                        <Form.Item
                            label="Email"
                            name="email"
                            rules={[{ required: true, message: 'Enter your email' }]}
                        >
                            <Input
                                size="large"
                                placeholder="example@email.com"
                                prefix={<MailOutlined style={{ color: '#999' }} />}
                            />
                        </Form.Item>

                        <Form.Item
                            label={
                                <div className="flex flex-space-between w-100">
                                    <span>Password</span>
                                    <a href="#" className="login-forgot-link p5">Forgot password?</a>
                                </div>
                            }
                            name="password"
                            rules={[{ required: true, message: 'Enter your password' }]}
                        >
                            <Input.Password
                                size="large"
                                placeholder="••••••••"
                                prefix={<LockOutlined style={{ color: '#999' }} />}
                                iconRender={(visible) =>
                                    visible ? <EyeOutlined style={{ color: '#999' }} /> : <EyeInvisibleOutlined style={{ color: '#999' }} />
                                }
                            />
                        </Form.Item>

                        <Form.Item name="remember" valuePropName="checked" className="login-remember-item mb-3">
                            <Checkbox>Remember me</Checkbox>
                        </Form.Item>

                        <Form.Item>
                            <Button type="primary" htmlType="submit" size="large" block className="login-submit-btn" loading={loading}>
                                Sign in
                                <RightOutlined className="ml-2" />
                            </Button>
                        </Form.Item>
                    </Form>

                    <div className="login-divider flex flex-center gap-2 my-4">
                        <span className="login-divider-line" />
                        <span className="login-divider-text p5 uppercase">or continue with</span>
                        <span className="login-divider-line" />
                    </div>

                    <div className="login-social flex gap-2">
                        <Button size="large" block className="login-social-btn">
                            <svg width="18" height="18" viewBox="0 0 18 18" className="mr-2">
                                <path fill="#4285F4" d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.874 2.684-6.615z" />
                                <path fill="#34A853" d="M9 18c2.43 0 4.467-.806 6.168-2.172l-2.908-2.258c-.806.54-1.837.86-3.26.86-2.513 0-4.646-1.697-5.414-3.96H.957v2.332C2.438 15.983 5.482 18 9 18z" />
                                <path fill="#FBBC05" d="M3.586 10.471c-.18-.54-.282-1.117-.282-1.71 0-.593.102-1.17.282-1.71V4.719H.957C.347 6.054 0 7.504 0 8.961s.348 2.907.957 4.242l2.629-2.332z" />
                                <path fill="#EA4335" d="M9 3.58c1.414 0 2.69.486 3.703 1.418l2.782-2.782C13.463.891 11.426 0 9 0 5.482 0 2.438 2.017.957 4.719L3.586 7.05C4.354 4.787 6.487 3.09 9 3.09z" />
                            </svg>
                            Google
                        </Button>
                        <Button size="large" block className="login-social-btn">
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" className="mr-2">
                                <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
                            </svg>
                            Github
                        </Button>
                    </div>

                    <p className="login-signup text-center mt-5 p4">
                        Don't have an account?{' '}
                        <a href="/signup" onClick={(e) => { e.preventDefault(); navigate('/signup'); }} className="font-weight-600">Create free account</a>
                    </p>
                </div>
            </div>
        </div>
        </>
    );
}
