import { useState } from 'react';
import './signUp.scss';
import { Button, Checkbox, Form, Input, message } from 'antd';
import { MailOutlined, LockOutlined, UserOutlined, SafetyCertificateOutlined, RightOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { authService, type SignUpPayload } from '../../services/auth/auth.service';
import logoWhite from '../../assets/logo-white-no-background.svg';

export default function SignUpPage() {
  const navigate = useNavigate();
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [loadingGoogle, setLoadingGoogle] = useState(false);
  const [loadingGithub, setLoadingGithub] = useState(false);
  const [messageApi, contextHolder] = message.useMessage();

  const onGoogleSignUp = async () => {
    setLoadingGoogle(true);
    try {
      await authService.signInWithGoogle();
    } catch (error: unknown) {
      setLoadingGoogle(false);
      messageApi.error(
        error instanceof Error ? error.message : 'Error signing up with Google.'
      );
    }
  };

  const onGithubSignUp = async () => {
    setLoadingGithub(true);
    try {
      await authService.signInWithGithub();
    } catch (error: unknown) {
      setLoadingGithub(false);
      messageApi.error(
        error instanceof Error ? error.message : 'Error signing up with GitHub.'
      );
    }
  };

  const onFinish = async (values: SignUpPayload) => {
    setLoading(true);

    const hideLoading = messageApi.loading('Creating account...', 0);

    try {
      const result = await authService.signUpWithEmail(values);
      hideLoading();

      if (result.requiresEmailConfirmation) {
        messageApi.success('Account created! Please check your email to confirm your account.');
        navigate('/login');
      } else {
        messageApi.success('Account created successfully!');
        navigate('/dashboard');
      }
    } catch (error: unknown) {
      hideLoading();
      messageApi.error(
        error instanceof Error ? error.message : 'Error creating account. Please try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {contextHolder}
      <div className="signup-page">
        <div className="signup-card">
          {/* Left Panel: Brand Showcase */}
          <div className="signup-card-left">
            <div>
              <div className="signup-branding">
                <img src={logoWhite} alt="Heavenance" className="h-10 w-auto" />
                <h2 className="signup-brand-text">Heavenance</h2>
              </div>
              <h3 className="signup-tagline">
                The future of your financial freedom starts here.
              </h3>
              <p className="signup-description">
                Join thousands of people who have already saved over $2M using our platform.
              </p>
            </div>

            <div className="signup-features">
              <div className="signup-feature-box">
                <span className="signup-feature-value">Free</span>
                <span className="signup-feature-label">Get started today</span>
              </div>
            </div>
          </div>

          {/* Right Panel: Sign Up Form */}
          <div className="signup-card-right">
            <div className="signup-form-wrapper">
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold text-blue-700 tracking-tight mb-1">
                  Create your account
                </h1>
                <p className="text-sm text-black-200 mb-5">
                  Start transforming your financial life today.
                </p>
              </div>

              <Form
                form={form}
                layout="vertical"
                onFinish={onFinish}
                requiredMark={false}
                colon={false}
              >
                <Form.Item
                  label="Full Name"
                  name="fullName"
                  rules={[{ required: true, message: 'Enter your full name' }]}
                  className="mb-3"
                >
                  <Input
                    size="large"
                    placeholder="John Silva"
                    prefix={<UserOutlined className="text-blue-500/70" />}
                  />
                </Form.Item>

                <Form.Item
                  label="Email"
                  name="email"
                  rules={[{ required: true, message: 'Enter your email' }]}
                  className="mb-3"
                >
                  <Input
                    size="large"
                    placeholder="example@email.com"
                    prefix={<MailOutlined className="text-blue-500/70" />}
                  />
                </Form.Item>

                <Form.Item
                  label="Password"
                  name="password"
                  rules={[{ required: true, message: 'Enter your password' }]}
                  className="mb-3"
                >
                  <Input.Password
                    size="large"
                    placeholder="••••••••"
                    prefix={<LockOutlined className="text-blue-500/70" />}
                  />
                </Form.Item>

                <Form.Item
                  label="Confirm Password"
                  name="confirmPassword"
                  className="mb-3"
                  rules={[
                    { required: true, message: 'Confirm your password' },
                    ({ getFieldValue }) => ({
                      validator(_, value) {
                        if (!value || getFieldValue('password') === value) {
                          return Promise.resolve();
                        }
                        return Promise.reject(new Error('Passwords do not match'));
                      },
                    }),
                  ]}
                >
                  <Input.Password
                    size="large"
                    placeholder="••••••••"
                    prefix={<SafetyCertificateOutlined className="text-blue-500/70" />}
                  />
                </Form.Item>

                <Form.Item
                  name="terms"
                  valuePropName="checked"
                  rules={[{ required: true, message: 'You must accept the terms' }]}
                  className="signup-terms-item mb-4"
                >
                  <Checkbox>
                    I agree with the{' '}
                    <a href="#">Terms of Service</a>
                    {' '}and{' '}
                    <a href="#">Privacy Policy</a>
                  </Checkbox>
                </Form.Item>

                <Form.Item className="mb-0">
                  <Button
                    type="primary"
                    htmlType="submit"
                    size="large"
                    block
                    className="signup-submit-btn"
                    loading={loading}
                  >
                    Create my account
                    <RightOutlined className="ml-2" />
                  </Button>
                </Form.Item>
              </Form>

              <div className="signup-divider">
                <span className="signup-divider-line" />
                <span className="signup-divider-text">or register with</span>
                <span className="signup-divider-line" />
              </div>

              <div className="flex gap-3">
                <Button
                  size="large"
                  block
                  className="signup-social-btn"
                  onClick={onGoogleSignUp}
                  loading={loadingGoogle}
                  disabled={loadingGoogle}
                >
                  <svg width="18" height="18" viewBox="0 0 18 18" className="mr-2">
                    <path fill="#4285F4" d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.874 2.684-6.615z" />
                    <path fill="#34A853" d="M9 18c2.43 0 4.467-.806 6.168-2.172l-2.908-2.258c-.806.54-1.837.86-3.26.86-2.513 0-4.646-1.697-5.414-3.96H.957v2.332C2.438 15.983 5.482 18 9 18z" />
                    <path fill="#FBBC05" d="M3.586 10.471c-.18-.54-.282-1.117-.282-1.71 0-.593.102-1.17.282-1.71V4.719H.957C.347 6.054 0 7.504 0 8.961s.348 2.907.957 4.242l2.629-2.332z" />
                    <path fill="#EA4335" d="M9 3.58c1.414 0 2.69.486 3.703 1.418l2.782-2.782C13.463.891 11.426 0 9 0 5.482 0 2.438 2.017.957 4.719L3.586 7.05C4.354 4.787 6.487 3.09 9 3.09z" />
                  </svg>
                  Google
                </Button>
                <Button
                  size="large"
                  block
                  className="signup-social-btn"
                  onClick={onGithubSignUp}
                  loading={loadingGithub}
                  disabled={loadingGithub}
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" className="mr-2">
                    <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
                  </svg>
                  GitHub
                </Button>
              </div>

              <p className="signup-login">
                Already have an account?
                <a
                  href="/login"
                  onClick={(e) => {
                    e.preventDefault();
                    navigate('/login');
                  }}
                >
                  Log in
                </a>
              </p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
