import { Routes } from '@angular/router';

export const routes: Routes = [

  /* ============================
     🔐 AUTH (SIN SIDEBAR)
  ============================ */
  {
    path: 'auth',
    children: [
      {
        path: 'login',
        loadComponent: () =>
          import('./pages/auth/login/login')
            .then(m => m.LoginComponent),
      },
      {
        path: 'register',
        loadComponent: () =>
          import('./pages/auth/register/register')
            .then(m => m.RegisterComponent),
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
      import('./layout/main-layout/main-layout')
        .then(m => m.MainLayoutComponent),

    children: [

      // Landing
      {
        path: '',
        loadComponent: () =>
          import('./pages/landing/landing')
            .then(m => m.LandingComponent),
      },

      // Home
      {
        path: 'home',
        loadComponent: () =>
          import('./pages/home/home')
            .then(m => m.HomeComponent),
      },

      // Group
      {
        path: 'group',
        loadComponent: () =>
          import('./pages/group/group')
            .then(m => m.GroupComponent),
      },

      // User
      {
        path: 'user',
        loadComponent: () =>
          import('./pages/user/user')
            .then(m => m.UserComponent),
      },

    ],
  },

  /* ============================
     🚫 404
  ============================ */
  { path: '**', redirectTo: '' },

];