/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Screen, RegisteredUser } from './types';
import { INITIAL_USERS } from './data';
import Header from './components/Header';
import HomeView from './components/HomeView';
import AboutView from './components/AboutView';
import DomicilioView from './components/DomicilioView';
import Experience360View from './components/Experience360View';
import SpaView from './components/SpaView';
import LimpiezaFacialView from './components/LimpiezaFacialView';
import MembershipsView from './components/MembershipsView';
import RegistroView from './components/RegistroView';
import AdminLoginView from './components/AdminLoginView';
import AdminDashboardView from './components/AdminDashboardProView';
type AdminDashboardTypedProps = {
  users: RegisteredUser[];
  onLogout: () => void;
  onNavigate: (screen: Screen) => void;
  onDeleteUser: (userId: string) => void;
  onAddUser: (user: RegisteredUser) => Promise<boolean>;
  onUpdateUser: (user: RegisteredUser) => Promise<void> | void;
  onSyncDatabase: () => void;
  isSyncing: boolean;
};
const AdminDashboardTyped = AdminDashboardView as unknown as React.ComponentType<AdminDashboardTypedProps>;
import LegalView from './components/LegalView';
import CursosView from './components/CursosView';
import ProductosView from './components/ProductosView';
import emailjs from '@emailjs/browser';
import { isSupabaseConfigured, supabase, mapRowToUser } from './lib/supabaseClient';

emailjs.init('Oql46z_LFLkAI8_DE');

const SCREEN_HASHES: Screen[] = [
  'home',
  'sobre-nosotros',
  'servicio-domicilio',
  'experiencia-360',
  'spa-capilar',
  'limpieza-facial',
  'membresias',
  'registro',
  'login-admin',
  'dashboard-admin',
  'legal',
  'cursos',
  'productos',
];

const getScreenFromHash = (hash: string): Screen => {
  const normalized = hash.replace('#', '');
  return SCREEN_HASHES.includes(normalized as Screen) ? (normalized as Screen) : 'home';
};

export default function App() {
  const [currentScreen, setCurrentScreen] = useState<Screen>(() => getScreenFromHash(window.location.hash));
const [users, setUsers] = useState<RegisteredUser[]>(() => {
    const savedUsers = localStorage.getItem('xlmx_users');
    try {
      return savedUsers ? JSON.parse(savedUsers) : INITIAL_USERS;
    } catch {
      localStorage.removeItem('xlmx_users');
      return INITIAL_USERS;
    }
  });
const [isAdminLoggedIn, setIsAdminLoggedIn] = useState<boolean>(() => {
  return localStorage.getItem('xlmx_admin_logged') === 'true';
});
const [loggedInClient, setLoggedInClient] = useState<RegisteredUser | null>(() => {
    const savedClient = localStorage.getItem('xlmx_logged_client');
    try {
      return savedClient ? JSON.parse(savedClient) : null;
    } catch {
      localStorage.removeItem('xlmx_logged_client');
      return null;
    }
  });
  const [emailStatus, setEmailStatus] = useState<string | null>(null);
  const [failedEmailJobs, setFailedEmailJobs] = useState<Array<{id:string; template:string; params:any; error?: any; ts?: string; attempts?: number; dbId?: any;}>>([]);
  const [showFailedDetails, setShowFailedDetails] = useState(false);

useEffect(() => {
  if (!isSupabaseConfigured) return;
  supabase.auth.getSession().then(({ data }) => {
    setIsAdminLoggedIn(Boolean(data.session));
    if (data.session) localStorage.setItem('xlmx_admin_logged', 'true');
  });
  const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
    setIsAdminLoggedIn(Boolean(session));
    if (session) localStorage.setItem('xlmx_admin_logged', 'true');
    else localStorage.removeItem('xlmx_admin_logged');
  });
  return () => listener.subscription.unsubscribe();
}, []);

useEffect(() => {
    localStorage.setItem('xlmx_users', JSON.stringify(users));
  }, [users]);
useEffect(() => {
  if (!isSupabaseConfigured) return;

  const loadUsers = async () => {
    console.log("Cargando usuarios desde Supabase...");
    const { data, error } = await supabase.from('users').select('*');
    if (error) {
      console.error("Error de conexión al cargar usuarios:", error.message);
      return;
    }
    if (data) {
      const remoteUsers = data.map(mapRowToUser);
      // Supabase es la fuente autoritativa cuando responde. No se vuelven a
      // subir usuarios que falten allí, porque pueden haber sido eliminados.
      setUsers(remoteUsers);
      console.log("Usuarios cargados desde Supabase:", data.length);
    }
  };

  loadUsers();
}, []);
  useEffect(() => {
    if (loggedInClient) {
      localStorage.setItem('xlmx_logged_client', JSON.stringify(loggedInClient));
    } else {
      localStorage.removeItem('xlmx_logged_client');
    }
  }, [loggedInClient]);

  useEffect(() => {
    if (!isSupabaseConfigured || !loggedInClient) return;

    const verifyCurrentUser = async () => {
      const { data, error } = await supabase
        .from('users')
        .select('id')
        .eq('id', loggedInClient.id)
        .maybeSingle();

      if (error) {
        console.error('Error al verificar usuario actual:', error);
        return;
      }

      if (!data) {
        setLoggedInClient(null);
        setCurrentScreen('registro');
        setEmailStatus('Tu usuario ha sido eliminado. Vuelve a registrarte para continuar.');
        setTimeout(() => setEmailStatus(null), 5000);
      }
    };

    verifyCurrentUser();
  }, [loggedInClient]);

  useEffect(() => {
    if (!isSupabaseConfigured || !loggedInClient) return;
    supabase.from('user_activity').insert({
      user_id: loggedInClient.id,
      event_type: 'page_view',
      page_slug: currentScreen,
    }).then(({ error }) => {
      if (error) console.warn('No se pudo registrar la actividad del usuario:', error.message);
    });
  }, [currentScreen, loggedInClient]);

  // Realtime sync with Supabase users table.
  useEffect(() => {
    if (!isSupabaseConfigured) return;

    const channel = supabase
      .channel('users-changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'users' },
        (payload) => {
          if (payload.eventType === 'INSERT' && payload.new) {
            const addedUser = mapRowToUser(payload.new);
            setUsers((prev) => {
              if (prev.some((user) => user.id === addedUser.id)) {
                return prev.map((user) => (user.id === addedUser.id ? addedUser : user));
              }
              return [addedUser, ...prev];
            });
          }

          if (payload.eventType === 'UPDATE' && payload.new) {
            const updatedUser = mapRowToUser(payload.new);
            setUsers((prev) => prev.map((user) => (user.id === updatedUser.id ? updatedUser : user)));
            if (loggedInClient?.id === updatedUser.id) {
              setLoggedInClient(updatedUser);
            }
          }

          if (payload.eventType === 'DELETE' && payload.old) {
            const deletedId = payload.old.id;
            setUsers((prev) => prev.filter((user) => user.id !== deletedId));
            if (loggedInClient?.id === deletedId) {
              setLoggedInClient(null);
              setCurrentScreen('registro');
              setEmailStatus('Tu usuario ha sido eliminado. Vuelve a registrarte para continuar.');
              setTimeout(() => setEmailStatus(null), 5000);
            }
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [loggedInClient]);

  // Sync screen state with browser hash history.
  useEffect(() => {
    const onHashChange = () => {
      const screen = getScreenFromHash(window.location.hash);
      setCurrentScreen(screen);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    window.addEventListener('hashchange', onHashChange);
    return () => window.removeEventListener('hashchange', onHashChange);
  }, []);

  useEffect(() => {
    const desiredHash = `#${currentScreen}`;
    if (window.location.hash !== desiredHash) {
      history.replaceState(null, '', desiredHash);
    }
  }, [currentScreen]);

  const navigateTo = (screen: Screen) => {
    setCurrentScreen(screen);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Navigation controller
  const handleNavigate = (screen: Screen) => {
    if (screen === 'dashboard-admin' && !isAdminLoggedIn) {
      navigateTo('login-admin');
    } else {
      navigateTo(screen);
    }
  };

  // User management hooks
const handleAddUser = async (newUser: RegisteredUser): Promise<boolean> => {
  if (isSupabaseConfigured) {
    const { error } = await supabase
      .from('users')
      .insert([
        {
          id: newUser.id,
          fullname: newUser.fullname,
          email: newUser.email,
          phone: newUser.phone,
          age: newUser.age,
          is_socio: newUser.isSocio,
          membership: newUser.membership,
          created_at: newUser.createdAt,
        },
      ]);

    if (error) {
      console.error('Error al guardar en Supabase:', error.message, error.details ?? error);
      alert('Hubo un error al guardar tus datos, intenta de nuevo.');
      return false;
    }
  } else {
    console.warn('Registro guardado localmente: Supabase no está configurado.');
  }

  setUsers((prev) => [newUser, ...prev]);
  console.log(isSupabaseConfigured ? 'Usuario guardado con éxito en la nube' : 'Usuario guardado localmente');
  alert('¡Registro exitoso!');

  const emailTemplateParams = {
    user_id: newUser.id,
    user_name: newUser.fullname,
    user_email: newUser.email,
    to_email: newUser.email,
    to_name: newUser.fullname,
    reply_to: newUser.email,
    user_phone: newUser.phone,
    user_membership: newUser.membership,
    is_socio: newUser.isSocio ? 'Sí' : 'No',
    registration_date: new Date().toLocaleString(),
    welcome_message: 'Gracias por registrarte en XLMX Barber, te damos la bienvenida al club premium.',
  };

  try {
    await emailjs.send('service_ta0f47t', 'template_16q07to', emailTemplateParams);
    console.log('Email de registro enviado correctamente.');
    setEmailStatus('Notificación de registro enviada correctamente.');
    setTimeout(() => setEmailStatus(null), 5000);
  } catch (emailError: any) {
    console.error('Error al enviar notificación por email (welcome):', emailError);
    const errInfo = { message: emailError?.message ?? String(emailError), stack: emailError?.stack ?? null };
    setEmailStatus('No se pudo enviar la notificación de bienvenida. El sistema la reintentará automáticamente.');
    const jobEntry = { id: newUser.id, template: 'template_16q07to', params: emailTemplateParams, error: errInfo, ts: new Date().toISOString(), attempts: 1 };
    setFailedEmailJobs((prev) => [...prev, jobEntry]);
    // try to persist for automatic retries
    (async () => {
      const dbId = await persistFailedEmailJob(jobEntry);
      if (dbId) {
        setFailedEmailJobs((prev) => prev.map((j) => (j === jobEntry ? { ...j, dbId } : j)));
      }
    })();
    setTimeout(() => setEmailStatus(null), 8000);
  }

  const adminEmailTemplateParams = {
    user_id: newUser.id,
    user_name: newUser.fullname,
    user_email: newUser.email,
    user_phone: newUser.phone,
    user_membership: newUser.membership,
    is_socio: newUser.isSocio ? 'Sí' : 'No',
    registration_date: new Date().toLocaleString(),
    admin_notice: 'Nuevo cliente registrado en el sistema.',
    admin_email: 'matymoya4@gmail.com',
  };

  try {
    await emailjs.send('service_ta0f47t', 'template_9c1f548', adminEmailTemplateParams);
    console.log('Email administrativo enviado correctamente.');
  } catch (adminEmailError: any) {
    console.error('Error al enviar notificación administrativa por email:', adminEmailError);
    const errInfo = { message: adminEmailError?.message ?? String(adminEmailError), stack: adminEmailError?.stack ?? null };
    const adminJob = { id: newUser.id, template: 'template_9c1f548', params: adminEmailTemplateParams, error: errInfo, ts: new Date().toISOString(), attempts: 1 };
    setFailedEmailJobs((prev) => [...prev, adminJob]);
    (async () => {
      const dbId = await persistFailedEmailJob(adminJob);
      if (dbId) {
        setFailedEmailJobs((prev) => prev.map((j) => (j === adminJob ? { ...j, dbId } : j)));
      }
    })();
  }

  return true;
};

  const resendFailedEmails = async () => {
  if (failedEmailJobs.length === 0) return;

  const remaining: typeof failedEmailJobs = [];
  for (const job of failedEmailJobs) {
    try {
      await emailjs.send('service_ta0f47t', job.template, job.params);
      console.log('Reenvío exitoso:', job.template, job.id);
      // If we persisted this job, mark it as sent
      if ((job as any).dbId) {
        try {
          await supabase.from('email_logs').update({ status: 'sent', attempts: (job.attempts ?? 1) }).eq('id', (job as any).dbId);
        } catch (e) {
          console.warn('No se pudo actualizar el registro de email en la DB tras reintento exitoso.', e);
        }
      }
    } catch (err: any) {
      console.error('Fallo al reintentar email:', err, job);
      // increment attempts in DB if present
      if ((job as any).dbId) {
        try {
          await supabase.from('email_logs').update({ attempts: (job.attempts ?? 1) + 1 }).eq('id', (job as any).dbId);
        } catch (e) {
          console.warn('No se pudo incrementar attempts en DB.', e);
        }
      }
      remaining.push({ ...job, attempts: (job.attempts ?? 0) + 1 });
    }
  }

  setFailedEmailJobs(remaining);
  if (remaining.length === 0) {
    setEmailStatus('Todos los emails pendientes fueron reenviados correctamente.');
    setTimeout(() => setEmailStatus(null), 5000);
  } else {
    setEmailStatus(`${remaining.length} notificaciones siguen pendientes.`);
    setTimeout(() => setEmailStatus(null), 6000);
  }
};

  // Persist failed job to Supabase for automatic background retries
  const persistFailedEmailJob = async (job: {id:string; template:string; params:any; error?: any; ts?: string; attempts?: number;}) => {
  try {
    const payload = {
      user_id: job.id,
      template: job.template,
      params: job.params,
      error: job.error,
      attempts: job.attempts ?? 1,
      status: 'failed',
      created_at: job.ts ?? new Date().toISOString(),
    } as any;

    const { data, error } = await supabase.from('email_logs').insert([payload]).select().maybeSingle();
    if (error) {
      console.warn('No se pudo persistir email log en Supabase:', error.message ?? error);
      return null;
    }
    return data?.id ?? null;
  } catch (err) {
    console.warn('Excepción al persistir email log:', err);
    return null;
  }
};

  // Load persisted failed email jobs from Supabase on startup
  const loadPersistedFailedJobs = async () => {
  try {
    const { data, error } = await supabase.from('email_logs').select('*').eq('status', 'failed');
    if (error) {
      console.warn('No se pudo cargar email_logs desde Supabase:', error.message ?? error);
      return;
    }
    if (!data) return;
    const jobs = data.map((r:any) => ({ id: r.user_id, template: r.template, params: r.params, error: r.error, ts: r.created_at, attempts: r.attempts, dbId: r.id }));
    if (jobs.length) setFailedEmailJobs((prev) => [...prev, ...jobs]);
  } catch (err) {
    console.warn('Excepción cargando email logs:', err);
  }
};

  // Start periodic auto-retry for pending failed emails
  useEffect(() => {
    let interval = setInterval(() => {
      // attempt re-send if there are failed jobs
      if (failedEmailJobs.length > 0) resendFailedEmails();
    }, 120000); // every 2 minutes

    return () => clearInterval(interval);
  }, [failedEmailJobs]);

  // Load persisted jobs once on mount
  useEffect(() => {
    loadPersistedFailedJobs();
  }, []);

  const handleDeleteUser = async (userId: string) => {
  if (isSupabaseConfigured) {
    const { error } = await supabase.from('users').delete().eq('id', userId);
    if (error) {
      console.error('Error al borrar en Supabase:', error);
      alert('No se pudo eliminar el usuario de la base de datos.');
      return;
    }
  }

  setUsers((prev) => prev.filter((u) => u.id !== userId));

  if (loggedInClient?.id === userId) {
    setLoggedInClient(null);
    setCurrentScreen('registro');
    setEmailStatus('Tu usuario ha sido eliminado. Vuelve a registrarte para continuar.');
    setTimeout(() => setEmailStatus(null), 5000);
  }
};

  const handleUpdateUser = async (updatedUser: RegisteredUser) => {
  try {
    let updated = updatedUser;
    if (isSupabaseConfigured) {
      const { data, error } = await supabase
        .from('users')
        .update({
          fullname: updatedUser.fullname,
          email: updatedUser.email,
          phone: updatedUser.phone,
          age: updatedUser.age,
          is_socio: updatedUser.isSocio,
          membership: updatedUser.membership,
        })
        .eq('id', updatedUser.id)
        .select()
        .maybeSingle();

      if (error) {
        console.error('Error al actualizar en Supabase:', error);
        alert('No se pudo actualizar el usuario en la base de datos.');
        return;
      }

      updated = data ? mapRowToUser(data) : updatedUser;
    }

    setUsers((prev) => prev.map(u => u.id === updated.id ? updated : u));

    if (loggedInClient?.id === updated.id) {
      setLoggedInClient(updated);
    }
  } catch (err) {
    console.error('Excepción al actualizar usuario:', err);
    alert('Error inesperado al actualizar usuario.');
  }
};

const handleLoginSuccess = () => {
  setIsAdminLoggedIn(true);
  localStorage.setItem('xlmx_admin_logged', 'true');
};

const handleLogoutAdmin = () => {
  setIsAdminLoggedIn(false);
  localStorage.removeItem('xlmx_admin_logged');
  if (isSupabaseConfigured) void supabase.auth.signOut();
};

const handleLogoutClient = () => {
    setLoggedInClient(null);
    localStorage.removeItem('xlmx_logged_client');
  };
  const currentMembership = loggedInClient?.membership?.toLowerCase() || '';
  const [isSyncing, setIsSyncing] = useState(false);

  const themeClass = 
    currentMembership === 'gold' ? 'theme-gold' :
    currentMembership === 'plata' ? 'theme-plata' :
    currentMembership === 'bronce' ? 'theme-bronce' : '';

  const handleSyncDatabase = async () => {
  if (!isSupabaseConfigured) {
    alert('Supabase no está configurado. Agrega VITE_SUPABASE_URL y VITE_SUPABASE_ANON_KEY en .env.local.');
    return;
  }

  setIsSyncing(true);
  try {
    const { data, error } = await supabase.from('users').select('*');
    if (error) throw error;

    const usersFromDb = (data ?? []).map(mapRowToUser);
    setUsers(usersFromDb);
    alert("¡Base de datos sincronizada con éxito!");
  } catch (err) {
    console.error("Error al sincronizar:", err);
    alert("Error al conectar con la base de datos.");
  } finally {
    setIsSyncing(false);
  }
};

  return (
    <div className={`min-h-screen bg-zinc-950 flex flex-col selection:bg-amber-400 selection:text-zinc-950 ${themeClass}`}>
      
      {/* Dynamic Navigation Header */}
      <Header
        currentScreen={currentScreen}
        onNavigate={handleNavigate}
        isAdminLoggedIn={isAdminLoggedIn}
        onLogoutAdmin={handleLogoutAdmin}
        loggedInClient={loggedInClient}
        onLogoutClient={handleLogoutClient}
      />

      {emailStatus && (
        <div className="max-w-4xl mx-auto mt-4 px-4 py-3 rounded border border-amber-200/20 bg-amber-400/10 text-amber-100 text-sm text-center">
          {emailStatus}
        </div>
      )}
      {/* Los reintentos de correo son automáticos y no se exponen al cliente. */}
      {false && failedEmailJobs.length > 0 && (
        <div className="max-w-4xl mx-auto mt-2 px-4 py-2 rounded border border-rose-200/20 bg-rose-400/5 text-rose-100 text-sm text-center">
          <div className="flex items-center justify-between gap-3">
            <span>{failedEmailJobs.length} notificación(es) pendientes de envío.</span>
            <div className="flex items-center gap-2">
              <button onClick={resendFailedEmails} className="px-3 py-1 rounded bg-amber-400 text-zinc-900 text-xs">Reintentar notificaciones</button>
              <button onClick={() => setShowFailedDetails(true)} className="px-3 py-1 rounded bg-zinc-800 text-zinc-200 text-xs">Ver detalles</button>
            </div>
          </div>
        </div>
      )}

      {false && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
          <div className="bg-zinc-900 p-4 rounded w-full max-w-2xl overflow-auto max-h-[80vh]">
            <div className="flex justify-between items-center mb-3">
              <h3 className="text-lg font-bold">Detalles de notificaciones fallidas</h3>
              <div className="flex items-center gap-2">
                <button onClick={() => setShowFailedDetails(false)} className="px-3 py-1 rounded bg-zinc-800">Cerrar</button>
              </div>
            </div>
            <div className="space-y-3">
              {failedEmailJobs.map((job, idx) => (
                <div key={idx} className="p-3 rounded border border-zinc-800 bg-zinc-950">
                  <div className="text-xs text-zinc-400">ID: {job.id} · Template: {job.template} · {job.ts}</div>
                  <pre className="text-[12px] text-zinc-200 whitespace-pre-wrap mt-2">{String(job.error?.message ?? JSON.stringify(job.error))}</pre>
                  <div className="mt-2 flex gap-2">
                    <button onClick={async () => { try { await emailjs.send('service_ta0f47t', job.template, job.params); setFailedEmailJobs(prev => prev.filter((_,i) => i!==idx)); } catch(err:any){ alert('Fallo al reintentar: '+(err.message||err)); } }} className="px-2 py-1 rounded bg-amber-400 text-zinc-900 text-xs">Reintentar este</button>
                    <button onClick={() => setFailedEmailJobs(prev => prev.filter((_,i) => i!==idx))} className="px-2 py-1 rounded bg-zinc-700 text-zinc-200 text-xs">Eliminar</button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
      {/* Main Content Router with elegant fade transitions */}
      <main className="flex-grow">
        
        {currentScreen === 'home' && (
          <HomeView onNavigate={handleNavigate} />
        )}

        {currentScreen === 'sobre-nosotros' && (
          <AboutView onNavigate={handleNavigate} />
        )}

        {currentScreen === 'servicio-domicilio' && (
          <DomicilioView onNavigate={handleNavigate} />
        )}

        {currentScreen === 'experiencia-360' && (
          <Experience360View onNavigate={handleNavigate} />
        )}

        {currentScreen === 'spa-capilar' && (
          <SpaView onNavigate={handleNavigate} />
        )}

        {currentScreen === 'limpieza-facial' && (
          <LimpiezaFacialView onNavigate={handleNavigate} />
        )}

        {currentScreen === 'membresias' && (
          <MembershipsView onNavigate={handleNavigate} />
        )}

        {currentScreen === 'registro' && (
          <RegistroView 
            onNavigate={handleNavigate} 
            onAddUser={handleAddUser} 
            setLoggedInClient={setLoggedInClient}
          />
        )}

        {currentScreen === 'login-admin' && (
          <AdminLoginView 
            onNavigate={handleNavigate} 
            onLoginSuccess={handleLoginSuccess}
            users={users}
            onAddUser={handleAddUser}
            loggedInClient={loggedInClient}
            setLoggedInClient={setLoggedInClient}
          />
        )}

              {currentScreen === 'dashboard-admin' && (
          <AdminDashboardTyped
            users={users}
            onLogout={handleLogoutAdmin}
            onNavigate={handleNavigate}
            onDeleteUser={handleDeleteUser}
            onAddUser={handleAddUser}
            onUpdateUser={handleUpdateUser}
            onSyncDatabase={handleSyncDatabase}
            isSyncing={isSyncing}
          />
        )}

        {currentScreen === 'legal' && (
          <LegalView onNavigate={handleNavigate} />
        )}

        {currentScreen === 'cursos' && (
          <CursosView onNavigate={handleNavigate} />
        )}

        {currentScreen === 'productos' && (
          <ProductosView onNavigate={handleNavigate} />
        )}

        {currentScreen === 'legal' && (
          <LegalView onNavigate={handleNavigate} />
        )}

      </main>

    </div> 
  );
}
