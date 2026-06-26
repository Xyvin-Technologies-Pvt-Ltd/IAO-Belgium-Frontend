import MasterDataManager from "@/components/admin/master-data/MasterDataManager";

const Departments = () => (
  <MasterDataManager
    endpoint="/master-data/department"
    queryKey="departments"
    i18nPrefix="departmentManagement"
  />
);

export default Departments;
