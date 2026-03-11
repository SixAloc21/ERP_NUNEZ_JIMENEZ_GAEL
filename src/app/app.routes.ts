import { Routes } from '@angular/router';

export const routes: Routes = [
  /* ============================
     🌐 PÚBLICO (SIN SIDEBAR)
  ============================ */
  {
    path: '',
    loadComponent: () =>
      import('./pages/landing/landing').then(m => m.LandingComponent),
  },

  /* ============================
     🔐 AUTH (SIN SIDEBAR)
  ============================ */
  {
    path: 'auth',
    children: [
      {
        path: 'login',
        loadComponent: () =>
          import('./pages/auth/login/login').then(m => m.LoginComponent),
      },
      {
        path: 'register',
        loadComponent: () =>
          import('./pages/auth/register/register').then(m => m.RegisterComponent),
      },
      { path: '', redirectTo: 'login', pathMatch: 'full' },
    ],
  },

  /* ============================
     🏠 APP (CON SIDEBAR)
  ============================ */
  {
    path: '',
    loadComponent: () =>
      import('./layout/main-layout/main-layout').then(m => m.MainLayoutComponent),
    children: [
      {
        path: 'home',
        loadComponent: () =>
          import('./pages/home/home').then(m => m.HomeComponent),
      },
      {
        path: 'group',
        loadComponent: () =>
          import('./pages/group/group').then(m => m.GroupComponent),
      },
      {
        path: 'user',
        loadComponent: () =>
          import('./pages/user/user').then(m => m.UserComponent),
      },

      {
        path: 'profile',
        loadComponent: () =>
          import('./pages/profile/profile').then(m => m.ProfileComponent),
      },
    ],
  },

  /* ============================
     🚫 404
  ============================ */
  { path: '**', redirectTo: '' },
];