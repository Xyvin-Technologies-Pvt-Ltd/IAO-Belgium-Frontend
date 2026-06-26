import MasterDataManager from "@/components/admin/master-data/MasterDataManager";

const Regions = () => (
  <MasterDataManager
    endpoint="/master-data/region"
    queryKey="regions"
    i18nPrefix="regionManagement"
  />
);

export default Regions;
