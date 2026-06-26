import MasterDataManager from "@/components/admin/master-data/MasterDataManager";

const ContractTypes = () => (
  <MasterDataManager
    endpoint="/master-data/contract-type"
    queryKey="contract-types"
    i18nPrefix="contractTypeManagement"
  />
);

export default ContractTypes;
