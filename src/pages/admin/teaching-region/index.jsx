import MasterDataManager from "@/components/admin/master-data/MasterDataManager";

const TeachingRegions = () => (
  <MasterDataManager
    endpoint="/master-data/teaching-region"
    queryKey="teaching-regions"
    i18nPrefix="teachingRegionManagement"
  />
);

export default TeachingRegions;
