import React, { useState, useEffect, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  useGetGlobalDefaults,
  useUpdateGlobalDefaults,
  useGetProformaRegions,
  useCreateProformaRegion,
  useUpdateProformaRegion,
  useDeleteProformaRegion,
} from "@/store/useProformaStore";
import { useGetTeacherRole } from "@/store/useTeacherRoleStore";
import { useGetCities } from "@/store/useCityStore";

export default function ProformaSettingsConfig() {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState("claimable_costs"); // 'claimable_costs' | 'regions'

  // API Queries
  const { data: defaultsRes } = useGetGlobalDefaults();
  const { data: regionsRes } = useGetProformaRegions();
  const { data: teacherRolesRes } = useGetTeacherRole();
  const { data: citiesRes } = useGetCities();

  const globalDefaults = defaultsRes?.data;
  const regionsList = regionsRes?.data || [];

  // Filter ONLY active lecturer roles with useMemo to prevent creating a new array reference on every render
  const teacherRoles = useMemo(() => {
    return (teacherRolesRes?.data || []).filter(
      (role) => role.status !== false && role.status !== "inactive" && role.status !== "deleted"
    );
  }, [teacherRolesRes?.data]);

  const cities = citiesRes?.data || [];

  // Mutations
  const updateDefaultsMutation = useUpdateGlobalDefaults();
  const createRegionMutation = useCreateProformaRegion();
  const updateRegionMutation = useUpdateProformaRegion();
  const deleteRegionMutation = useDeleteProformaRegion();

  // Category Toggles State
  const [toggles, setToggles] = useState({
    travel_enabled: true,
    food_enabled: true,
    stay_enabled: true,
    miscellaneous_enabled: true,
  });

  useEffect(() => {
    if (globalDefaults?.category_toggles) {
      const next = globalDefaults.category_toggles;
      setToggles((prev) => {
        if (
          prev.travel_enabled === next.travel_enabled &&
          prev.food_enabled === next.food_enabled &&
          prev.stay_enabled === next.stay_enabled &&
          prev.miscellaneous_enabled === next.miscellaneous_enabled
        ) {
          return prev;
        }
        return { ...next };
      });
    }
  }, [globalDefaults]);

  // Detailed Editable Rules Data
  const [travelRules, setTravelRules] = useState([
    {
      key: "road",
      name: "Road",
      calc: "Travel Formula (€0.4326/km, Return x2, nearest km)",
      rate_per_km: 0.4326,
      multiplier: 2,
      rounding: "NEAREST_KM",
      amount: "—",
      cap: "—",
      proof_required: false,
      status: true,
    },
    {
      key: "rail",
      name: "Rail",
      calc: "Actual cost",
      amount: "—",
      cap: "—",
      proof_required: true,
      status: true,
    },
    {
      key: "flight",
      name: "Flight",
      calc: "Actual cost",
      amount: "—",
      cap: "—",
      proof_required: true,
      status: true,
    },
  ]);

  const [stayRules, setStayRules] = useState([
    {
      key: "food",
      name: "Food",
      calc: "Fixed per day",
      amount: "25,00 € / day",
      daily_rate: 25.0,
      min_hours: 4.0,
      cap: "—",
      proof_required: false,
      status: true,
    },
    {
      key: "accommodation",
      name: "Accommodation",
      calc: "Actual cost",
      amount: "Max 120,00 € / night",
      cap: "120,00 €",
      max_nightly_rate: 120.0,
      proof_required: true,
      status: true,
    },
  ]);

  const [otherRules, setOtherRules] = useState([
    {
      key: "miscellaneous",
      name: "Miscellaneous Claims",
      calc: "Actual cost",
      amount: "—",
      cap: "—",
      proof_required: true,
      status: true,
    },
  ]);

  // Modal States
  const [showAddRegionModal, setShowAddRegionModal] = useState(false);
  const [showEditRegionModal, setShowEditRegionModal] = useState(false);
  const [selectedRegion, setSelectedRegion] = useState(null);
  const [editRegionForm, setEditRegionForm] = useState({
    name: "",
    code: "",
    cities: [],
    status: true,
    blocks_per_module: "",
    travel_rate: "",
    food_rate: "",
    stay_rate: "",
  });

  const [showEditRuleModal, setShowEditRuleModal] = useState(false);
  const [selectedRule, setSelectedRule] = useState(null);
  const [editRuleForm, setEditRuleForm] = useState({
    name: "",
    calc_type: "ACTUAL_COST",
    rate_per_km: 0.4326,
    daily_rate: 25.0,
    max_cap: 120.0,
    proof_required: false,
    status: true,
  });

  const [matrixState, setMatrixState] = useState({});

  useEffect(() => {
    if (regionsList.length === 0 || teacherRoles.length === 0) return;
    const initial = {};
    regionsList.forEach((reg) => {
      initial[reg._id] = {};
      (reg.teaching_rates || []).forEach((tr) => {
        const roleId = tr.teacher_role_id?._id || tr.teacher_role_id;
        if (roleId) {
          initial[reg._id][roleId] = tr.hourly_rate ?? "";
        }
      });
    });
    setMatrixState((prev) => {
      if (JSON.stringify(prev) === JSON.stringify(initial)) return prev;
      return initial;
    });
  }, [regionsList, teacherRoles]);

  const [newRegionForm, setNewRegionForm] = useState({ name: "", code: "", cities: [] });

  const handleOpenEditRegion = (region) => {
    setSelectedRegion(region);
    const assignedCityIds = (region.cities || []).map((c) => c._id || c);
    setEditRegionForm({
      name: region.name || "",
      code: region.code || "",
      cities: assignedCityIds,
      status: region.status !== false,
      blocks_per_module: region.blocks_per_module ?? "",
      travel_rate: region.travel?.rate_per_km ?? "",
      food_rate: region.food?.daily_rate ?? "",
      stay_rate: region.stay?.max_nightly_rate ?? "",
    });
    setShowEditRegionModal(true);
  };

  const handleUpdateRegionSubmit = () => {
    if (!selectedRegion) return;
    updateRegionMutation.mutate(
      {
        id: selectedRegion._id,
        data: {
          name: editRegionForm.name,
          code: editRegionForm.code,
          cities: editRegionForm.cities,
          status: editRegionForm.status,
          blocks_per_module: editRegionForm.blocks_per_module !== "" ? parseInt(editRegionForm.blocks_per_module, 10) : null,
          ...(editRegionForm.travel_rate !== "" ? { travel: { rate_per_km: parseFloat(editRegionForm.travel_rate) } } : {}),
          ...(editRegionForm.food_rate !== "" ? { food: { daily_rate: parseFloat(editRegionForm.food_rate) } } : {}),
          ...(editRegionForm.stay_rate !== "" ? { stay: { max_nightly_rate: parseFloat(editRegionForm.stay_rate) } } : {}),
        },
      },
      {
        onSuccess: () => setShowEditRegionModal(false),
      }
    );
  };

  const handleDeleteRegion = (regionId, regionName) => {
    if (window.confirm(`Are you sure you want to delete Proforma Region "${regionName}"?`)) {
      deleteRegionMutation.mutate(regionId, {
        onSuccess: () => setShowEditRegionModal(false),
      });
    }
  };

  // INSTANT AUTO-SAVE TOGGLE SWITCH
  const handleToggleChange = (categoryKey, newValue) => {
    const updatedToggles = { ...toggles, [categoryKey]: newValue };
    setToggles(updatedToggles);
    updateDefaultsMutation.mutate({ category_toggles: updatedToggles });
  };

  const handleEditRuleClick = (rule, category) => {
    setSelectedRule({ ...rule, category });
    setEditRuleForm({
      name: rule.name,
      calc_type: rule.calc.includes("Formula") ? "FORMULA" : rule.calc.includes("Fixed") ? "FIXED_PER_DAY" : "ACTUAL_COST",
      rate_per_km: rule.rate_per_km || 0.4326,
      daily_rate: rule.daily_rate || 25.0,
      max_cap: parseFloat(rule.cap) || 120.0,
      proof_required: rule.proof_required,
      status: rule.status,
    });
    setShowEditRuleModal(true);
  };

  const handleSaveRule = () => {
    if (!selectedRule) return;

    const { category, key } = selectedRule;
    const isFormula = editRuleForm.calc_type === "FORMULA";
    const isFixed = editRuleForm.calc_type === "FIXED_PER_DAY";

    const calcDisplay = isFormula
      ? `Travel Formula (€${editRuleForm.rate_per_km}/km, Return x2, nearest km)`
      : isFixed
      ? `Fixed per day (${editRuleForm.daily_rate} € / day)`
      : "Actual cost";

    const amountDisplay = isFixed ? `${editRuleForm.daily_rate},00 € / day` : "—";
    const capDisplay = editRuleForm.max_cap > 0 ? `${editRuleForm.max_cap},00 €` : "—";

    const updatedObj = {
      ...selectedRule,
      name: editRuleForm.name,
      calc: calcDisplay,
      amount: amountDisplay,
      cap: capDisplay,
      rate_per_km: editRuleForm.rate_per_km,
      daily_rate: editRuleForm.daily_rate,
      proof_required: editRuleForm.proof_required,
      status: editRuleForm.status,
    };

    if (category === "travel") {
      setTravelRules(travelRules.map((r) => (r.key === key ? updatedObj : r)));
    } else if (category === "stay") {
      setStayRules(stayRules.map((r) => (r.key === key ? updatedObj : r)));
    } else if (category === "other") {
      setOtherRules(otherRules.map((r) => (r.key === key ? updatedObj : r)));
    }

    setShowEditRuleModal(false);
  };

  const handleCreateRegion = () => {
    if (!newRegionForm.name.trim() || !newRegionForm.code.trim()) return;
    createRegionMutation.mutate(newRegionForm, {
      onSuccess: () => {
        setShowAddRegionModal(false);
        setNewRegionForm({ name: "", code: "", cities: [] });
      },
    });
  };

  const handleMatrixChange = (regionId, roleId, value) => {
    setMatrixState((prev) => ({
      ...prev,
      [regionId]: {
        ...(prev[regionId] || {}),
        [roleId]: value,
      },
    }));
  };

  const handleSaveAllMatrixRates = () => {
    regionsList.forEach((region) => {
      const ratesArray = teacherRoles.map((role) => ({
        teacher_role_id: role._id,
        hourly_rate: parseFloat(matrixState[region._id]?.[role._id] || 0),
      }));

      updateRegionMutation.mutate({
        id: region._id,
        data: { teaching_rates: ratesArray },
      });
    });
  };

  return (
    <div className="space-y-6 mt-4 w-full max-w-full">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold text-dashboard-text dark:text-white">
          Proforma Invoice Master Settings
        </h1>
      </div>

      {/* Tabs Header - Text Only (No Icons) */}
      <div className="flex border-b border-border gap-6 text-sm font-medium">
        <button
          onClick={() => setActiveTab("claimable_costs")}
          className={`pb-3 border-b-2 transition ${
            activeTab === "claimable_costs"
              ? "border-primary text-primary font-semibold"
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          Claimable Costs & Section Toggles
        </button>

        <button
          onClick={() => setActiveTab("regions")}
          className={`pb-3 border-b-2 transition ${
            activeTab === "regions"
              ? "border-primary text-primary font-semibold"
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          Proforma Regions & Role Rates
        </button>
      </div>

      {/* TAB 1: Claimable Costs & Section Toggles */}
      {activeTab === "claimable_costs" && (
        <div className="space-y-6 w-full">
          {/* Claimable Category Toggles */}
          <Card className="w-full">
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Claimable Cost Category Toggles</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="flex items-center justify-between p-4 bg-sidebar rounded-xl border border-sidebar-border">
                  <div>
                    <p className="text-sm font-semibold text-foreground">Travel Expenses</p>
                  </div>
                  <Switch
                    checked={Boolean(toggles.travel_enabled)}
                    onCheckedChange={(val) => handleToggleChange("travel_enabled", val)}
                  />
                </div>

                <div className="flex items-center justify-between p-4 bg-sidebar rounded-xl border border-sidebar-border">
                  <div>
                    <p className="text-sm font-semibold text-foreground">Food / Meal Allowance</p>
                  </div>
                  <Switch
                    checked={Boolean(toggles.food_enabled)}
                    onCheckedChange={(val) => handleToggleChange("food_enabled", val)}
                  />
                </div>

                <div className="flex items-center justify-between p-4 bg-sidebar rounded-xl border border-sidebar-border">
                  <div>
                    <p className="text-sm font-semibold text-foreground">Stay / Accommodation</p>
                  </div>
                  <Switch
                    checked={Boolean(toggles.stay_enabled)}
                    onCheckedChange={(val) => handleToggleChange("stay_enabled", val)}
                  />
                </div>

                <div className="flex items-center justify-between p-4 bg-sidebar rounded-xl border border-sidebar-border">
                  <div>
                    <p className="text-sm font-semibold text-foreground">Miscellaneous Claims</p>
                  </div>
                  <Switch
                    checked={Boolean(toggles.miscellaneous_enabled)}
                    onCheckedChange={(val) => handleToggleChange("miscellaneous_enabled", val)}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Section 1: Travel Rules Table */}
          <Card className="w-full">
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Travel</CardTitle>
            </CardHeader>
            <CardContent className="w-full">
              <div className="border border-border rounded-xl overflow-x-auto w-full">
                <Table className="w-full">
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-1/6">Name</TableHead>
                      <TableHead className="w-2/6">Calculation</TableHead>
                      <TableHead className="w-1/6">Amount</TableHead>
                      <TableHead className="w-1/6">Cap</TableHead>
                      <TableHead className="w-1/12">Proof Required</TableHead>
                      <TableHead className="text-center w-1/12">Status</TableHead>
                      <TableHead className="text-center w-1/12">Action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {travelRules.map((r, idx) => (
                      <TableRow key={idx}>
                        <TableCell className="font-semibold text-foreground">{r.name}</TableCell>
                        <TableCell className="text-xs font-mono text-muted-foreground">{r.calc}</TableCell>
                        <TableCell className="font-mono">{r.amount}</TableCell>
                        <TableCell className="font-mono">{r.cap}</TableCell>
                        <TableCell>
                          <span className={`px-2 py-0.5 text-xs rounded-md font-medium ${r.proof_required ? 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400' : 'bg-muted text-muted-foreground'}`}>
                            {r.proof_required ? "Yes" : "No"}
                          </span>
                        </TableCell>
                        <TableCell className="text-center">
                          <Switch
                            checked={Boolean(r.status)}
                            onCheckedChange={(val) => {
                              const updated = [...travelRules];
                              updated[idx].status = val;
                              setTravelRules(updated);
                            }}
                          />
                        </TableCell>
                        <TableCell className="text-center">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleEditRuleClick(r, "travel")}
                          >
                            Edit
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>

          {/* Section 2: Stay Rules Table */}
          <Card className="w-full">
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Stay</CardTitle>
            </CardHeader>
            <CardContent className="w-full">
              <div className="border border-border rounded-xl overflow-x-auto w-full">
                <Table className="w-full">
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-1/6">Name</TableHead>
                      <TableHead className="w-2/6">Calculation</TableHead>
                      <TableHead className="w-1/6">Amount</TableHead>
                      <TableHead className="w-1/6">Cap</TableHead>
                      <TableHead className="w-1/12">Proof Required</TableHead>
                      <TableHead className="text-center w-1/12">Status</TableHead>
                      <TableHead className="text-center w-1/12">Action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {stayRules.map((r, idx) => (
                      <TableRow key={idx}>
                        <TableCell className="font-semibold text-foreground">{r.name}</TableCell>
                        <TableCell className="text-xs font-mono text-muted-foreground">{r.calc}</TableCell>
                        <TableCell className="font-mono">{r.amount}</TableCell>
                        <TableCell className="font-mono">{r.cap}</TableCell>
                        <TableCell>
                          <span className={`px-2 py-0.5 text-xs rounded-md font-medium ${r.proof_required ? 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400' : 'bg-muted text-muted-foreground'}`}>
                            {r.proof_required ? "Yes" : "No"}
                          </span>
                        </TableCell>
                        <TableCell className="text-center">
                          <Switch
                            checked={Boolean(r.status)}
                            onCheckedChange={(val) => {
                              const updated = [...stayRules];
                              updated[idx].status = val;
                              setStayRules(updated);
                            }}
                          />
                        </TableCell>
                        <TableCell className="text-center">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleEditRuleClick(r, "stay")}
                          >
                            Edit
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>

          {/* Section 3: Other Rules Table */}
          <Card className="w-full">
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Other / Miscellaneous</CardTitle>
            </CardHeader>
            <CardContent className="w-full">
              <div className="border border-border rounded-xl overflow-x-auto w-full">
                <Table className="w-full">
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-1/6">Name</TableHead>
                      <TableHead className="w-2/6">Calculation</TableHead>
                      <TableHead className="w-1/6">Amount</TableHead>
                      <TableHead className="w-1/6">Cap</TableHead>
                      <TableHead className="w-1/12">Proof Required</TableHead>
                      <TableHead className="text-center w-1/12">Status</TableHead>
                      <TableHead className="text-center w-1/12">Action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {otherRules.map((r, idx) => (
                      <TableRow key={idx}>
                        <TableCell className="font-semibold text-foreground">{r.name}</TableCell>
                        <TableCell className="text-xs font-mono text-muted-foreground">{r.calc}</TableCell>
                        <TableCell className="font-mono">{r.amount}</TableCell>
                        <TableCell className="font-mono">{r.cap}</TableCell>
                        <TableCell>
                          <span className={`px-2 py-0.5 text-xs rounded-md font-medium ${r.proof_required ? 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400' : 'bg-muted text-muted-foreground'}`}>
                            {r.proof_required ? "Yes" : "No"}
                          </span>
                        </TableCell>
                        <TableCell className="text-center">
                          <Switch
                            checked={Boolean(r.status)}
                            onCheckedChange={(val) => {
                              const updated = [...otherRules];
                              updated[idx].status = val;
                              setOtherRules(updated);
                            }}
                          />
                        </TableCell>
                        <TableCell className="text-center">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleEditRuleClick(r, "other")}
                          >
                            Edit
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* TAB 2: Rates per block (€) Matrix Table */}
      {activeTab === "regions" && (
        <Card className="border border-border w-full">
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <CardTitle className="text-lg font-bold text-foreground">Rates per block (€)</CardTitle>
            <Button onClick={() => setShowAddRegionModal(true)} variant="outline" size="sm">
              Add Region
            </Button>
          </CardHeader>
          <CardContent className="space-y-4">
            {regionsList.length > 0 && teacherRoles.length > 0 ? (
              <div className="border border-border rounded-xl overflow-x-auto bg-card">
                <Table className="w-full">
                  <TableHeader>
                    <TableRow className="bg-amber-50/50 dark:bg-amber-950/20 border-b border-border">
                      <TableHead className="font-semibold text-amber-900 dark:text-amber-300 w-48">
                        Lecturer role
                      </TableHead>
                      {regionsList.map((region) => (
                        <TableHead key={region._id} className="font-semibold text-foreground text-center min-w-[160px]">
                          <div className="flex items-center justify-center gap-1.5 py-1">
                            <span>{region.code ? `${region.code} · ${region.name}` : region.name}</span>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-6 w-6 p-0 hover:bg-muted text-xs"
                              title="Configure Region Settings"
                              onClick={() => handleOpenEditRegion(region)}
                            >
                              ⚙️
                            </Button>
                          </div>
                          {region.status === false && (
                            <span className="block text-[10px] bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300 px-1.5 py-0.5 rounded font-mono font-normal">
                              Disabled
                            </span>
                          )}
                        </TableHead>
                      ))}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {teacherRoles.map((role) => (
                      <TableRow key={role._id} className="hover:bg-muted/40 transition">
                        <TableCell className="font-semibold text-foreground">{role.name}</TableCell>
                        {regionsList.map((region) => {
                          const cellVal = matrixState[region._id]?.[role._id] ?? "";
                          return (
                            <TableCell key={region._id} className="text-center">
                              <Input
                                type="number"
                                step="1"
                                placeholder="—"
                                value={cellVal}
                                onChange={(e) => handleMatrixChange(region._id, role._id, e.target.value)}
                                className="w-24 text-center font-mono font-medium mx-auto rounded-lg border-border"
                              />
                            </TableCell>
                          );
                        })}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            ) : (
              <div className="p-8 text-center border border-dashed rounded-xl text-muted-foreground text-sm">
                No proforma regions or teacher roles found in database. Click &quot;Add Region&quot; above to create a region.
              </div>
            )}

            <div className="flex items-center justify-end pt-2">
              <Button
                onClick={handleSaveAllMatrixRates}
                disabled={regionsList.length === 0}
                className="px-6 font-semibold bg-amber-700 hover:bg-amber-800 text-white"
              >
                Save
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Dialog for Edit Rule */}
      <Dialog open={showEditRuleModal} onOpenChange={setShowEditRuleModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Configure Rule: {selectedRule?.name}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div>
              <Label className="text-xs uppercase font-semibold">Rule Name</Label>
              <Input
                type="text"
                value={editRuleForm.name}
                onChange={(e) => setEditRuleForm({ ...editRuleForm, name: e.target.value })}
              />
            </div>
            <div>
              <Label className="text-xs uppercase font-semibold">Calculation Method</Label>
              <Select
                value={editRuleForm.calc_type}
                onValueChange={(val) => setEditRuleForm({ ...editRuleForm, calc_type: val })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="FORMULA">Travel Formula (€ / km)</SelectItem>
                  <SelectItem value="FIXED_PER_DAY">Fixed per day (€ / day)</SelectItem>
                  <SelectItem value="FIXED_PER_WEEKEND">Fixed per teaching weekend (€ / weekend)</SelectItem>
                  <SelectItem value="ACTUAL_COST">Actual cost (Receipt based)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {editRuleForm.calc_type === "FORMULA" && (
              <div>
                <Label className="text-xs uppercase font-semibold">Rate per km (€)</Label>
                <Input
                  type="number"
                  step="0.0001"
                  value={editRuleForm.rate_per_km}
                  onChange={(e) => setEditRuleForm({ ...editRuleForm, rate_per_km: parseFloat(e.target.value) })}
                />
              </div>
            )}
            {editRuleForm.calc_type === "FIXED_PER_DAY" && (
              <div>
                <Label className="text-xs uppercase font-semibold">Daily Fixed Rate (€)</Label>
                <Input
                  type="number"
                  step="1"
                  value={editRuleForm.daily_rate}
                  onChange={(e) => setEditRuleForm({ ...editRuleForm, daily_rate: parseFloat(e.target.value) })}
                />
              </div>
            )}
            <div>
              <Label className="text-xs uppercase font-semibold">Max Cap Limit (€, 0 = No Cap)</Label>
              <Input
                type="number"
                step="10"
                value={editRuleForm.max_cap}
                onChange={(e) => setEditRuleForm({ ...editRuleForm, max_cap: parseFloat(e.target.value) })}
              />
            </div>
            <div className="flex items-center justify-between p-3.5 bg-sidebar rounded-xl border">
              <div>
                <p className="text-sm font-semibold">Proof Required (Receipt Upload)</p>
              </div>
              <Switch
                checked={editRuleForm.proof_required}
                onCheckedChange={(val) => setEditRuleForm({ ...editRuleForm, proof_required: val })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEditRuleModal(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveRule}>
              Save Rule Configuration
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog for Add Region */}
      <Dialog open={showAddRegionModal} onOpenChange={setShowAddRegionModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Add New Proforma Region</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div>
              <Label className="text-xs uppercase font-semibold">Region Code</Label>
              <Input
                type="text"
                placeholder="e.g. REG-1, DE-NL"
                value={newRegionForm.code}
                onChange={(e) => setNewRegionForm({ ...newRegionForm, code: e.target.value })}
              />
            </div>
            <div>
              <Label className="text-xs uppercase font-semibold">Region Name</Label>
              <Input
                type="text"
                placeholder="e.g. North Region, Netherlands & Germany"
                value={newRegionForm.name}
                onChange={(e) => setNewRegionForm({ ...newRegionForm, name: e.target.value })}
              />
            </div>
            <div>
              <Label className="text-xs uppercase font-semibold mb-2 block">Assign Cities (1 City = 1 Region)</Label>
              <div className="max-h-48 overflow-y-auto border border-border rounded-lg p-2 space-y-1.5 bg-sidebar">
                {cities.length > 0 ? (
                  cities.map((city) => {
                    const existingAssignedRegion = regionsList.find((r) =>
                      (r.cities || []).some((c) => (c._id || c) === city._id)
                    );
                    const isChecked = newRegionForm.cities.includes(city._id);
                    const isAlreadyAssigned = Boolean(existingAssignedRegion);

                    return (
                      <label
                        key={city._id}
                        className={`flex items-center justify-between text-sm p-1.5 rounded ${
                          isAlreadyAssigned ? "opacity-60 bg-muted/30 cursor-not-allowed" : "hover:bg-muted/50 cursor-pointer text-foreground"
                        }`}
                      >
                        <div className="flex items-center space-x-2">
                          <input
                            type="checkbox"
                            checked={isChecked}
                            disabled={isAlreadyAssigned}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setNewRegionForm({ ...newRegionForm, cities: [...newRegionForm.cities, city._id] });
                              } else {
                                setNewRegionForm({
                                  ...newRegionForm,
                                  cities: newRegionForm.cities.filter((id) => id !== city._id),
                                });
                              }
                            }}
                            className="rounded border-border text-amber-700 focus:ring-amber-700"
                          />
                          <span>{city.name}</span>
                        </div>
                        {isAlreadyAssigned && (
                          <span className="text-[10px] bg-muted px-2 py-0.5 rounded font-mono text-muted-foreground">
                            Assigned: {existingAssignedRegion.name}
                          </span>
                        )}
                      </label>
                    );
                  })
                ) : (
                  <p className="text-xs text-muted-foreground p-2">No cities found in system database.</p>
                )}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddRegionModal(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleCreateRegion}
              disabled={!newRegionForm.name.trim() || !newRegionForm.code.trim() || createRegionMutation.isLoading}
              className="bg-amber-700 hover:bg-amber-800 text-white font-medium"
            >
              {createRegionMutation.isLoading ? "Creating..." : "Create Region"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog for Edit / Manage Region */}
      <Dialog open={showEditRegionModal} onOpenChange={setShowEditRegionModal}>
        <DialogContent className="sm:max-w-2xl max-h-[85vh] flex flex-col">
          <DialogHeader>
            <DialogTitle>Configure Proforma Region: {selectedRegion?.name}</DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-2 overflow-y-auto flex-1 pr-1">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Left Column: Basic Details & Status */}
              <div className="space-y-4">
                <div>
                  <Label className="text-xs uppercase font-semibold">Region Code</Label>
                  <Input
                    type="text"
                    value={editRegionForm.code}
                    onChange={(e) => setEditRegionForm({ ...editRegionForm, code: e.target.value })}
                    className="mt-1"
                  />
                </div>

                <div>
                  <Label className="text-xs uppercase font-semibold">Region Name</Label>
                  <Input
                    type="text"
                    value={editRegionForm.name}
                    onChange={(e) => setEditRegionForm({ ...editRegionForm, name: e.target.value })}
                    className="mt-1"
                  />
                </div>

                {/* Enable / Disable Region Status Toggle */}
                <div className="flex items-center justify-between p-3.5 bg-sidebar rounded-xl border border-border">
                  <div>
                    <p className="text-sm font-semibold">Region Active Status</p>
                    <p className="text-[11px] text-muted-foreground mt-0.5">Disabled regions block invoice generation</p>
                  </div>
                  <Switch
                    checked={editRegionForm.status}
                    onCheckedChange={(val) => setEditRegionForm({ ...editRegionForm, status: val })}
                  />
                </div>
              </div>

              {/* Right Column: Regional Custom Rate Overrides */}
              <div className="border border-border rounded-xl p-3.5 bg-card space-y-3">
                <p className="text-xs font-bold uppercase text-amber-800 dark:text-amber-400">
                  Regional Custom Overrides (Optional)
                </p>

                <div>
                  <Label className="text-[11px] font-semibold text-foreground">Blocks per Module [Baseline: 15 blocks]</Label>
                  <Input
                    type="number"
                    step="1"
                    placeholder="Inherit Global (15 blocks)"
                    value={editRegionForm.blocks_per_module}
                    onChange={(e) => setEditRegionForm({ ...editRegionForm, blocks_per_module: e.target.value })}
                    className="font-mono text-xs mt-1"
                  />
                </div>

                <div>
                  <Label className="text-[11px] text-muted-foreground">Travel Rate per km (€) [Baseline: €0.4326]</Label>
                  <Input
                    type="number"
                    step="0.0001"
                    placeholder="Inherit Global (€0.4326/km)"
                    value={editRegionForm.travel_rate}
                    onChange={(e) => setEditRegionForm({ ...editRegionForm, travel_rate: e.target.value })}
                    className="font-mono text-xs mt-1"
                  />
                </div>

                <div>
                  <Label className="text-[11px] text-muted-foreground">Food Daily Rate (€) [Baseline: €25.00]</Label>
                  <Input
                    type="number"
                    step="1"
                    placeholder="Inherit Global (€25.00/day)"
                    value={editRegionForm.food_rate}
                    onChange={(e) => setEditRegionForm({ ...editRegionForm, food_rate: e.target.value })}
                    className="font-mono text-xs mt-1"
                  />
                </div>

                <div>
                  <Label className="text-[11px] text-muted-foreground">Stay Max Nightly Cap (€) [Baseline: €120.00]</Label>
                  <Input
                    type="number"
                    step="5"
                    placeholder="Inherit Global (€120.00/night)"
                    value={editRegionForm.stay_rate}
                    onChange={(e) => setEditRegionForm({ ...editRegionForm, stay_rate: e.target.value })}
                    className="font-mono text-xs mt-1"
                  />
                </div>
              </div>
            </div>

            {/* City Assignment Selection (Full Width Grid) */}
            <div>
              <Label className="text-xs uppercase font-semibold mb-2 block">Assigned Cities (1 City = 1 Region)</Label>
              <div className="max-h-48 overflow-y-auto border border-border rounded-lg p-2.5 bg-sidebar grid grid-cols-1 sm:grid-cols-2 gap-2">
                {cities.map((city) => {
                  const existingAssignedRegion = regionsList.find(
                    (r) => r._id !== selectedRegion?._id && (r.cities || []).some((c) => (c._id || c) === city._id)
                  );
                  const isChecked = editRegionForm.cities.includes(city._id);
                  const isAssignedToOther = Boolean(existingAssignedRegion);

                  return (
                    <label
                      key={city._id}
                      className={`flex items-center justify-between text-sm p-1.5 rounded border ${
                        isAssignedToOther ? "opacity-50 bg-muted/20 border-transparent cursor-not-allowed" : "hover:bg-muted/50 border-border cursor-pointer text-foreground"
                      }`}
                    >
                      <div className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          checked={isChecked}
                          disabled={isAssignedToOther}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setEditRegionForm({ ...editRegionForm, cities: [...editRegionForm.cities, city._id] });
                            } else {
                              setEditRegionForm({
                                ...editRegionForm,
                                cities: editRegionForm.cities.filter((id) => id !== city._id),
                              });
                            }
                          }}
                          className="rounded border-border text-amber-700 focus:ring-amber-700"
                        />
                        <span className="font-medium text-xs">{city.name}</span>
                      </div>
                      {isAssignedToOther && (
                        <span className="text-[10px] bg-muted px-1.5 py-0.5 rounded font-mono text-muted-foreground truncate max-w-[120px]">
                          {existingAssignedRegion.name}
                        </span>
                      )}
                    </label>
                  );
                })}
              </div>
            </div>
          </div>

          <DialogFooter className="flex items-center justify-between gap-2 pt-2 border-t border-border">
            <Button
              variant="destructive"
              size="sm"
              onClick={() => handleDeleteRegion(selectedRegion._id, selectedRegion.name)}
              disabled={deleteRegionMutation.isLoading}
            >
              {deleteRegionMutation.isLoading ? "Deleting..." : "Delete Region"}
            </Button>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={() => setShowEditRegionModal(false)}>
                Cancel
              </Button>
              <Button
                size="sm"
                onClick={handleUpdateRegionSubmit}
                disabled={!editRegionForm.name.trim() || updateRegionMutation.isLoading}
                className="bg-amber-700 hover:bg-amber-800 text-white font-medium"
              >
                {updateRegionMutation.isLoading ? "Saving..." : "Save Changes"}
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
