import { Outlet, useLocation } from "react-router-dom";
import AdminLayout from "./AdminLayout";

/** Routes that use full-bleed main content (matches former noPadding + route handle). */
const NO_PADDING_SEGMENTS = new Set(["items", "inventory", "orders"]);

/**
 * Single persistent shell for all /property-custodian/* routes.
 * Derives noPadding from the URL because useMatches() requires a data router
 * (createBrowserRouter); this app uses BrowserRouter + Routes.
 */
const AdminOutletLayout = () => {
  const { pathname } = useLocation();
  const segments = pathname.split("/").filter(Boolean);
  const pcIdx = segments.indexOf("property-custodian");
  const childSegment = pcIdx >= 0 ? segments[pcIdx + 1] : null;
  const noPadding = Boolean(childSegment && NO_PADDING_SEGMENTS.has(childSegment));

  return (
    <AdminLayout noPadding={noPadding}>
      <Outlet />
    </AdminLayout>
  );
};

export default AdminOutletLayout;
