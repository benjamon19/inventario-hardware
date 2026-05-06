'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createBrowserClient } from '@supabase/ssr';
import { Lock, CheckCircle, AlertCircle } from 'lucide-react';
import GlobalLoading from '@/app/loading';

export default function ActualizarPasswordPage() {
  const router = useRouter();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isChecking, setIsChecking] = useState(true);

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  useEffect(() => {
    let mounted = true;
    let timeoutId: ReturnType<typeof setTimeout>;

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (!mounted) return;

      if (event === 'PASSWORD_RECOVERY' || event === 'TOKEN_REFRESHED') {
        clearTimeout(timeoutId);
        setErrorMsg(null);
        setIsChecking(false);
        return;
      }

      if (session) {
        clearTimeout(timeoutId);
        setIsChecking(false);
        return;
      }
    });

    timeoutId = setTimeout(async () => {
      if (!mounted) return;
      const { data: { session } } = await supabase.auth.getSession();

      if (session) {
        setIsChecking(false);
      } else {
        const hasToken =
          window.location.hash.includes('access_token') ||
          window.location.search.includes('code=');

        if (hasToken) {
          setTimeout(async () => {
            if (!mounted) return;
            const { data: { session: retrySession } } = await supabase.auth.getSession();
            if (retrySession) {
              setIsChecking(false);
            } else {
              setErrorMsg('El enlace de recuperación no es válido o ha expirado.');
              setIsChecking(false);
            }
          }, 2000);
        } else {
          setErrorMsg('El enlace de recuperación no es válido o ha expirado.');
          setIsChecking(false);
        }
      }
    }, 800);

    return () => {
      mounted = false;
      clearTimeout(timeoutId);
      subscription.unsubscribe();
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    if (password !== confirmPassword) {
      setErrorMsg('Las contraseñas no coinciden.');
      return;
    }
    if (password.length < 6) {
      setErrorMsg('La contraseña debe tener al menos 6 caracteres.');
      return;
    }

    setIsUpdating(true);
    const { error } = await supabase.auth.updateUser({ password });

    if (error) {
      setErrorMsg('Hubo un error al actualizar la contraseña: ' + error.message);
      setIsUpdating(false);
    } else {
      setSuccessMsg('¡Contraseña actualizada con éxito!');
      setTimeout(() => router.push('/login'), 2500);
    }
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        backgroundColor: '#f8fafc',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '24px 16px',
        fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: '480px',
          backgroundColor: '#ffffff',
          borderRadius: '20px',
          border: '1px solid #e2e8f0',
          overflow: 'hidden',
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: '40px 32px 32px',
            textAlign: 'center',
            borderBottom: '1px solid #f1f5f9',
          }}
        >
          <table width="100%" cellPadding={0} cellSpacing={0} style={{ marginBottom: '18px' }}>
            <tbody>
              <tr>
                <td style={{ textAlign: 'center' }}>
                  <img
                    src="/wall-ico.svg"
                    alt=""
                    width={56}
                    height={56}
                    style={{ display: 'block', margin: '0 auto', width: 56, height: 56, objectFit: 'contain' }}
                  />
                </td>
              </tr>
            </tbody>
          </table>
          <p style={{ fontSize: 20, fontWeight: 700, color: '#0f172a', margin: '0 0 4px', letterSpacing: '-0.4px' }}>
            Restablecer contraseña
          </p>
          <p style={{ fontSize: 13, color: '#94a3b8', margin: 0 }}>
            Sistema de Inventario
          </p>
        </div>

        {/* Content */}
        <div style={{ padding: '32px' }}>
          {isChecking ? (
            <GlobalLoading />
          ) : errorMsg && !password ? (
            /* Enlace inválido */
            <div
              style={{
                backgroundColor: '#fef2f2',
                border: '1px solid #fee2e2',
                borderRadius: '12px',
                padding: '24px',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                textAlign: 'center',
                gap: '12px',
              }}
            >
              <AlertCircle size={32} color="#ef4444" />
              <p style={{ fontSize: 14, fontWeight: 600, color: '#b91c1c', margin: 0 }}>
                {errorMsg}
              </p>
              <button
                onClick={() => router.push('/login')}
                style={{
                  marginTop: 4,
                  fontSize: 13,
                  fontWeight: 500,
                  color: '#dc2626',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  textDecoration: 'underline',
                  textUnderlineOffset: '2px',
                }}
              >
                Volver al inicio de sesión
              </button>
            </div>
          ) : (
            <>
              {errorMsg && (
                <div
                  style={{
                    backgroundColor: '#fef2f2',
                    border: '1px solid #fee2e2',
                    borderRadius: '12px',
                    padding: '14px 16px',
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '10px',
                    marginBottom: '20px',
                  }}
                >
                  <AlertCircle size={18} color="#ef4444" style={{ flexShrink: 0, marginTop: 1 }} />
                  <p style={{ fontSize: 13, fontWeight: 500, color: '#b91c1c', margin: 0 }}>
                    {errorMsg}
                  </p>
                </div>
              )}

              {successMsg && (
                <div
                  style={{
                    backgroundColor: '#f0fdf4',
                    border: '1px solid #bbf7d0',
                    borderRadius: '12px',
                    padding: '14px 16px',
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '10px',
                    marginBottom: '20px',
                  }}
                >
                  <CheckCircle size={18} color="#22c55e" style={{ flexShrink: 0, marginTop: 1 }} />
                  <div>
                    <p style={{ fontSize: 13, fontWeight: 600, color: '#15803d', margin: '0 0 2px' }}>
                      {successMsg}
                    </p>
                    <p style={{ fontSize: 12, color: '#16a34a', margin: 0 }}>
                      Redirigiendo al inicio de sesión...
                    </p>
                  </div>
                </div>
              )}

              <form onSubmit={handleUpdate} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {/* Campo nueva contraseña */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <label style={{ fontSize: 13, fontWeight: 600, color: '#0f172a' }}>
                    Nueva contraseña
                  </label>
                  <div style={{ position: 'relative' }}>
                    <Lock
                      size={16}
                      color="#94a3b8"
                      style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }}
                    />
                    <input
                      type="password"
                      required
                      disabled={!!successMsg || isUpdating}
                      value={password}
                      onChange={e => setPassword(e.target.value)}
                      placeholder="••••••••"
                      style={{
                        width: '100%',
                        boxSizing: 'border-box',
                        border: '1px solid #e2e8f0',
                        borderRadius: '12px',
                        backgroundColor: '#f8fafc',
                        padding: '11px 14px 11px 36px',
                        fontSize: 14,
                        color: '#0f172a',
                        outline: 'none',
                        opacity: !!successMsg || isUpdating ? 0.5 : 1,
                      }}
                      onFocus={e => {
                        e.target.style.borderColor = '#0f172a';
                        e.target.style.backgroundColor = '#ffffff';
                      }}
                      onBlur={e => {
                        e.target.style.borderColor = '#e2e8f0';
                        e.target.style.backgroundColor = '#f8fafc';
                      }}
                    />
                  </div>
                </div>

                {/* Campo confirmar contraseña */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <label style={{ fontSize: 13, fontWeight: 600, color: '#0f172a' }}>
                    Confirmar contraseña
                  </label>
                  <div style={{ position: 'relative' }}>
                    <Lock
                      size={16}
                      color="#94a3b8"
                      style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }}
                    />
                    <input
                      type="password"
                      required
                      disabled={!!successMsg || isUpdating}
                      value={confirmPassword}
                      onChange={e => setConfirmPassword(e.target.value)}
                      placeholder="••••••••"
                      style={{
                        width: '100%',
                        boxSizing: 'border-box',
                        border: '1px solid #e2e8f0',
                        borderRadius: '12px',
                        backgroundColor: '#f8fafc',
                        padding: '11px 14px 11px 36px',
                        fontSize: 14,
                        color: '#0f172a',
                        outline: 'none',
                        opacity: !!successMsg || isUpdating ? 0.5 : 1,
                      }}
                      onFocus={e => {
                        e.target.style.borderColor = '#0f172a';
                        e.target.style.backgroundColor = '#ffffff';
                      }}
                      onBlur={e => {
                        e.target.style.borderColor = '#e2e8f0';
                        e.target.style.backgroundColor = '#f8fafc';
                      }}
                    />
                  </div>
                </div>

                <div style={{ height: '1px', backgroundColor: '#f1f5f9', margin: '4px 0' }} />

                <button
                  type="submit"
                  disabled={isUpdating || !!successMsg}
                  style={{
                    width: '100%',
                    backgroundColor: '#0f172a',
                    color: '#ffffff',
                    fontWeight: 600,
                    fontSize: 14,
                    padding: '13px',
                    borderRadius: '12px',
                    border: 'none',
                    cursor: isUpdating || !!successMsg ? 'not-allowed' : 'pointer',
                    opacity: isUpdating || !!successMsg ? 0.7 : 1,
                    letterSpacing: '-0.2px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                  }}
                >
                  {isUpdating ? 'Actualizando...' : 'Guardar nueva contraseña'}
                </button>
              </form>
            </>
          )}
        </div>

        {/* Footer */}
        <div
          style={{
            backgroundColor: '#f8fafc',
            borderTop: '1px solid #f1f5f9',
            padding: '16px 32px',
            textAlign: 'center',
          }}
        >
          <p style={{ fontSize: 12, color: '#cbd5e1', margin: 0 }}>
            Sistema de Inventario · Asistente Wall
          </p>
        </div>
      </div>
    </div>
  );
}