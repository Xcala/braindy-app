import { Navigate } from 'react-router';
import { useBrands } from '../../brands/BrandProvider';

/** Old Team page: people and permissions now live in Brands › Manage, so /team opens that sheet for the brand picked last. */
export function AdminTeam() {
  const { current } = useBrands();
  return <Navigate to={current ? `/admin/brands?manage=${current.id}` : '/admin/brands'} replace />;
}
