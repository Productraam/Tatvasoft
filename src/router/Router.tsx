import React, { createContext, useContext, useState, useEffect } from 'react';
import { saasService } from '../services/saasService';
import { Tenant } from '../types/saas';

interface RouterContextType {
  currentPath: string;
  navigate: (path: string) => void;
  isAdminRoute: boolean;
  isTempleRoute: boolean;
  isHomeRoute: boolean;
  isSubdomainRoute: boolean;
  isDemoRoute: boolean;
  subdomain: string | null;
  subdomainTenant: Tenant | null;
  subRoute: string;
}

const RouterContext = createContext<RouterContextType>({
  currentPath: 'home',
  navigate: () => {},
  isAdminRoute: false,
  isTempleRoute: false,
  isHomeRoute: true,
  isSubdomainRoute: false,
  isDemoRoute: false,
  subdomain: null,
  subdomainTenant: null,
  subRoute: '',
});

export function extractSubdomain(): string | null {
  // 1. From hostname e.g. sidhodlur.localhost or Sidhodlur.localhost:5173
  const hostname = window.location.hostname.toLowerCase();
  const parts = hostname.split('.');
  
  if (parts.length > 1) {
    if (parts[parts.length - 1] === 'localhost' && parts[0] !== 'localhost') {
      return parts[0];
    }
    if (parts.length >= 3 && parts[0] !== 'www') {
      return parts[0];
    }
  }

  // 2. Query param fallback e.g. ?subdomain=sidhodlur or ?tenant=sidhodlur
  const searchParams = new URLSearchParams(window.location.search);
  const qSub = searchParams.get('subdomain') || searchParams.get('tenant');
  if (qSub) return qSub.toLowerCase();

  // 3. Hash fallback e.g. #/subdomain/sidhodlur or #/tenant/sidhodlur
  const hash = window.location.hash.toLowerCase();
  const match = hash.match(/^#\/?(?:subdomain|tenant)\/([a-z0-9-]+)/);
  if (match) return match[1];

  return null;
}

function normalizeHash(hash: string): string {
  const cleaned = hash.replace(/^#\/?/, '').trim();
  if (!cleaned || cleaned === 'home') {
    return 'home';
  }
  return cleaned;
}

export const RouterProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentPath, setCurrentPath] = useState<string>(() => {
    return normalizeHash(window.location.hash);
  });

  const [subdomain, setSubdomain] = useState<string | null>(() => {
    return extractSubdomain();
  });

  const [subdomainTenant, setSubdomainTenant] = useState<Tenant | null>(() => {
    const sub = extractSubdomain();
    return sub === 'demo'
      ? saasService.getTenant('t-102') || null
      : sub ? saasService.getTenantBySubdomain(sub) || null : null;
  });

  useEffect(() => {
    const refreshSubdomainTenant = async () => {
      const sub = extractSubdomain();
      if (!sub) return;
      const tenants = await saasService.refreshTenantRegistry();
      if (!tenants) return;
      setSubdomainTenant(sub === 'demo'
        ? tenants.find((tenant) => tenant.id === 't-102') || null
        : tenants.find((tenant) => tenant.subdomain?.toLowerCase() === sub || tenant.slug?.toLowerCase() === sub) || null);
    };
    void refreshSubdomainTenant();

    const handleHashChange = () => {
      const p = normalizeHash(window.location.hash);
      setCurrentPath(p);
      const sub = extractSubdomain();
      setSubdomain(sub);
      setSubdomainTenant(sub === 'demo'
        ? saasService.getTenant('t-102') || null
        : sub ? saasService.getTenantBySubdomain(sub) || null : null);
    };

    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  const navigate = (path: string) => {
    const target = path.startsWith('/') ? path.slice(1) : path;
    window.location.hash = target === 'home' || target === '' ? '#/' : `#/${target}`;
  };

  const isSubdomainRoute = Boolean(subdomain && subdomainTenant);
  const isDemoRoute = subdomain === 'demo' && isSubdomainRoute;
  const isAdminRoute = currentPath.startsWith('admin') && !isSubdomainRoute;
  const isTempleRoute = currentPath.startsWith('temple') || currentPath === 'login' || currentPath.startsWith('login') || currentPath === 'pos' || isSubdomainRoute;
  const isHomeRoute = !isAdminRoute && !isTempleRoute && !isSubdomainRoute;

  const segments = currentPath.split('/');
  let subRoute = segments.length > 1 ? segments.slice(1).join('/') : '';
  if (subRoute === 'login') subRoute = 'pos';

  return (
    <RouterContext.Provider 
      value={{ 
        currentPath, 
        navigate, 
        isAdminRoute, 
        isTempleRoute, 
        isHomeRoute, 
        isSubdomainRoute,
        isDemoRoute,
        subdomain,
        subdomainTenant,
        subRoute 
      }}
    >
      {children}
    </RouterContext.Provider>
  );
};

export const useRouter = () => useContext(RouterContext);

export const Link: React.FC<{
  to: string;
  className?: string;
  children: React.ReactNode;
  onClick?: () => void;
}> = ({ to, className, children, onClick }) => {
  const { navigate } = useRouter();
  const normalizedTo = to.startsWith('/') ? to.slice(1) : to;

  return (
    <a
      href={normalizedTo === 'home' || normalizedTo === '' ? '#/' : `#/${normalizedTo}`}
      className={className || ''}
      onClick={(e) => {
        e.preventDefault();
        navigate(normalizedTo);
        if (onClick) onClick();
      }}
    >
      {children}
    </a>
  );
};
