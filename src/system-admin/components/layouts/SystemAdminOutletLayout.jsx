import { Outlet } from "react-router-dom";
import SystemAdminLayout from "./SystemAdminLayout";

/**
 * Single persistent shell for all /system-admin/* routes.
 */
const SystemAdminOutletLayout = () => {
  return (
    <SystemAdminLayout>
      <Outlet />
    </SystemAdminLayout>
  );
};

export default SystemAdminOutletLayout;
