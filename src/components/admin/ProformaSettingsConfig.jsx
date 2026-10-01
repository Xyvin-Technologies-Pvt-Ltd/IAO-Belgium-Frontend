import React, { useState, useEffect, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import { useGetAllCities } from "@/store/useDropdownStore";
import { toast } from "sonner";
import { Pencil } from "lucide-react";

const DEFAULT_TRAVEL_RULES = [
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
];

export default function ProformaSettingsConfig() {
  const [activeTab, setActiveTab] = useState("claimable_costs");

  const { data: defaultsRes } = useGetGlobalDefaults();
  const { data: regionsRes } = useGetProformaRegions();
  const { data: teacherRolesRes } = useGetTeacherRole();
  const { data: citiesRes } = useGetAllCities({});

  const globalDefaults = defaultsRes?.data;
  const regionsList = regionsRes?.data || [];

  const teacherRoles = useMemo(() => {
    return (teacherRolesRes?.data || []).filter(
      (role) => role.status !== false && role.status !== "inactive" && role.status !== "deleted"
    );
  }, [teacherRolesRes?.data]);

  const cities = citiesRes?.data || [];

  const updateDefaultsMutation = useUpdateGlobalDefaults();
  const createRegionMutation = useCreateProformaRegion();
  const updateRegionMutation = useUpdateProformaRegion();
  const deleteRegionMutation = useDeleteProformaRegion();

  const [toggles, setToggles] = useState({
    travel_enabled: true,
    food_enabled: true,
    stay_enabled: true,
    miscellaneous_enabled: true,
  });

  const [programTypeProforma, setProgramTypeProforma] = useState([]);

  const [travelRules, setTravelRules] = useState(DEFAULT_TRAVEL_RULES);
  const [stayRules, setStayRules] = useState([
    {
      key: "food",
      name: "Food",
      calc: "Fixed per day",
      amount: "25,00 € / day",
      daily_rate: 25.0,
      min_hours: 4.0,
      cap: "—",
      proof_required: true,
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

  useEffect(() => {
    if (!globalDefaults) return;

    if (globalDefaults.category_toggles) {
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

    if (Array.isArray(globalDefaults.program_type_proforma)) {
      setProgramTypeProforma(globalDefaults.program_type_proforma);
    }

    const t = globalDefaults.travel || {};
    const rate = t.rate_per_km ?? 0.4326;
    const mult = t.trip_multiplier ?? 2;
    const rounding = t.rounding || "NEAREST_KM";
    setTravelRules([
      {
        key: "road",
        name: "Road",
        calc: `Travel Formula (€${rate}/km, Return x${mult}, ${String(rounding).toLowerCase().replace(/_/g, " ")})`,
        rate_per_km: rate,
        multiplier: mult,
        rounding,
        amount: "—",
        cap: "—",
        proof_required: t.road?.proof_required ?? false,
        status: true,
      },
      {
        key: "rail",
        name: "Rail",
        calc: "Actual cost",
        amount: "—",
        cap: "—",
        proof_required: t.rail?.proof_required ?? true,
        status: true,
      },
      {
        key: "flight",
        name: "Flight",
        calc: "Actual cost",
        amount: "—",
        cap: "—",
        proof_required: t.flight?.proof_required ?? true,
        status: true,
      },
    ]);

    const foodRate = globalDefaults.food?.daily_rate ?? 25;
    const stayCap = globalDefaults.stay?.max_nightly_rate ?? 120;
    setStayRules([
      {
        key: "food",
        name: "Food",
        calc: "Fixed per day",
        amount: `${Number(foodRate).toFixed(2).replace(".", ",")} € / day`,
        daily_rate: foodRate,
        min_hours: globalDefaults.food?.minimum_hours ?? 4,
        cap: "—",
        proof_required: globalDefaults.food?.requires_receipt ?? true,
        status: true,
      },
      {
        key: "accommodation",
        name: "Accommodation",
        calc: "Actual cost",
        amount: `Max ${Number(stayCap).toFixed(2).replace(".", ",")} € / night`,
        cap: `${Number(stayCap).toFixed(2).replace(".", ",")} €`,
        max_nightly_rate: stayCap,
        proof_required: globalDefaults.stay?.requires_receipt ?? true,
        status: true,
      },
    ]);

    setOtherRules([
      {
        key: "miscellaneous",
        name: "Miscellaneous Claims",
        calc: "Actual cost",
        amount: "—",
        cap: "—",
        proof_required: globalDefaults.miscellaneous?.proof_required ?? true,
        status: true,
      },
    ]);
  }, [globalDefaults]);

  const [showAddRegionModal, setShowAddRegionModal] = useState(false);
  const [showEditRegionModal, setShowEditRegionModal] = useState(false);
  const [selectedRegion, setSelectedRegion] = useState(null);
  const [editRegionForm, setEditRegionForm] = useState({
    name: "",
    code: "",
    cities: [],
    is_active: true,
    blocks_per_module: "",
    travel_pricing_mode: "PER_KM",
    travel_rate: "",
    travel_fixed_session_rate: "",
    food_rate: "",
    stay_rate: "",
  });

  const [showEditRuleModal, setShowEditRuleModal] = useState(false);
  const [selectedRule, setSelectedRule] = useState(null);
  const [editRuleForm, setEditRuleForm] = useState({
    name: "",
    calc_type: "ACTUAL_COST",
    rate_per_km: 0.4326,
    multiplier: 2,
    rounding: "NEAREST_KM",
    daily_rate: 25.0,
    max_nightly_rate: 120.0,
    proof_required: false,
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
    const mode = region.travel?.pricing_mode === "FIXED_PER_SESSION" ? "FIXED_PER_SESSION" : "PER_KM";
    setEditRegionForm({
      name: region.name || "",
      code: region.code || "",
      cities: assignedCityIds,
      is_active: region.is_active !== false,
      blocks_per_module: region.blocks_per_module ?? "",
      travel_pricing_mode: mode,
      travel_rate: region.travel?.rate_per_km ?? "",
      travel_fixed_session_rate: region.travel?.fixed_session_rate ?? "",
      food_rate: region.food?.daily_rate ?? "",
      stay_rate: region.stay?.max_nightly_rate ?? "",
    });
    setShowEditRegionModal(true);
  };

  const handleUpdateRegionSubmit = () => {
    if (!selectedRegion) return;
    const travelPayload = {
      pricing_mode: editRegionForm.travel_pricing_mode || "PER_KM",
    };
    if (editRegionForm.travel_pricing_mode === "FIXED_PER_SESSION") {
      travelPayload.fixed_session_rate =
        editRegionForm.travel_fixed_session_rate !== ""
          ? parseFloat(editRegionForm.travel_fixed_session_rate)
          : null;
    } else if (editRegionForm.travel_rate !== "") {
      travelPayload.rate_per_km = parseFloat(editRegionForm.travel_rate);
    }

    updateRegionMutation.mutate(
      {
        id: selectedRegion._id,
        data: {
          name: editRegionForm.name,
          code: editRegionForm.code,
          cities: editRegionForm.cities,
          is_active: editRegionForm.is_active,
          blocks_per_module:
            editRegionForm.blocks_per_module !== "" ? parseInt(editRegionForm.blocks_per_module, 10) : null,
          travel: travelPayload,
          ...(editRegionForm.food_rate !== ""
            ? { food: { daily_rate: parseFloat(editRegionForm.food_rate) } }
            : {}),
          ...(editRegionForm.stay_rate !== ""
            ? { stay: { max_nightly_rate: parseFloat(editRegionForm.stay_rate) } }
            : {}),
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

  const handleToggleChange = (categoryKey, newValue) => {
    const updatedToggles = { ...toggles, [categoryKey]: newValue };
    setToggles(updatedToggles);
    updateDefaultsMutation.mutate({ category_toggles: updatedToggles });
  };

  const handleProgramTypeProformaChange = (programType, enabled) => {
    const updated = programTypeProforma.map((row) =>
      row.program_type === programType ? { ...row, enabled } : row
    );
    setProgramTypeProforma(updated);
    updateDefaultsMutation.mutate({ program_type_proforma: updated });
  };

  const handleEditRuleClick = (rule, category) => {
    setSelectedRule({ ...rule, category });
    let calc_type = "ACTUAL_COST";
    if (rule.key === "road" || rule.calc?.includes("Formula")) calc_type = "FORMULA";
    else if (rule.key === "food" || rule.calc?.includes("Fixed")) calc_type = "FIXED_PER_DAY";

    setEditRuleForm({
      name: rule.name,
      calc_type,
      rate_per_km: rule.rate_per_km ?? 0.4326,
      multiplier: rule.multiplier ?? 2,
      rounding: rule.rounding || "NEAREST_KM",
      // Use nullish coalescing so 0 is preserved (0 || 25 was forcing 25)
      daily_rate: rule.daily_rate ?? 25.0,
      max_nightly_rate: rule.max_nightly_rate ?? 120.0,
      proof_required: Boolean(rule.proof_required),
    });
    setShowEditRuleModal(true);
  };

  const handleSaveRule = () => {
    if (!selectedRule) return;
    const { category, key } = selectedRule;

    if (category === "travel") {
      if (key === "road") {
        updateDefaultsMutation.mutate(
          {
            travel: {
              rate_per_km: editRuleForm.rate_per_km,
              trip_multiplier: editRuleForm.multiplier,
              rounding: editRuleForm.rounding,
              road: { proof_required: editRuleForm.proof_required },
            },
          },
          { onSuccess: () => setShowEditRuleModal(false) }
        );
      } else if (key === "rail" || key === "flight") {
        updateDefaultsMutation.mutate(
          {
            travel: {
              [key]: { proof_required: editRuleForm.proof_required },
            },
          },
          { onSuccess: () => setShowEditRuleModal(false) }
        );
      }
      return;
    }

    if (category === "stay") {
      if (key === "food") {
        updateDefaultsMutation.mutate(
          {
            food: {
              daily_rate: Number(editRuleForm.daily_rate) || 0,
              requires_receipt: editRuleForm.proof_required,
            },
          },
          { onSuccess: () => setShowEditRuleModal(false) }
        );
      } else if (key === "accommodation") {
        updateDefaultsMutation.mutate(
          {
            stay: {
              max_nightly_rate: Number(editRuleForm.max_nightly_rate) || 0,
              requires_receipt: editRuleForm.proof_required,
            },
          },
          { onSuccess: () => setShowEditRuleModal(false) }
        );
      }
      return;
    }

    if (category === "other" && key === "miscellaneous") {
      updateDefaultsMutation.mutate(
        { miscellaneous: { proof_required: editRuleForm.proof_required } },
        { onSuccess: () => setShowEditRuleModal(false) }
      );
    }
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

  const handleSaveAllMatrixRates = async () => {
    try {
      await Promise.all(
        regionsList.map((region) => {
          const ratesArray = teacherRoles.map((role) => ({
            teacher_role_id: role._id,
            hourly_rate: parseFloat(matrixState[region._id]?.[role._id] || 0),
          }));

          return updateRegionMutation.mutateAsync({
            id: region._id,
            data: { teaching_rates: ratesArray },
            silent: true,
          });
        })
      );
      toast.success("Rates saved successfully!");
    } catch (error) {
      toast.error(error?.message || "Failed to save rates");
    }
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
          {/* Program type master switch */}
          <Card className="w-full">
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Teacher proforma by program type</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {programTypeProforma.map((row) => (
                  <div
                    key={row.program_type}
                    className="flex items-center justify-between p-4 bg-sidebar rounded-xl border border-sidebar-border gap-3"
                  >
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-foreground truncate">{row.program_type}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {row.enabled ? "Proforma generated" : "Proforma skipped"}
                      </p>
                    </div>
                    <Switch
                      checked={Boolean(row.enabled)}
                      onCheckedChange={(val) => handleProgramTypeProformaChange(row.program_type, val)}
                    />
                  </div>
                ))}
                {programTypeProforma.length === 0 && (
                  <p className="text-sm text-muted-foreground col-span-full">Loading program types…</p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Claimable Category Toggles */}
          <Card className="w-full">
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Enable Claimable Cost Categories</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="flex items-center justify-between p-4 bg-sidebar rounded-xl border border-sidebar-border">
                  <div>
                    <p className="text-sm font-semibold text-foreground">Travel Expenses</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {toggles.travel_enabled ? "Included on invoices" : "Excluded from invoices"}
                    </p>
                  </div>
                  <Switch
                    checked={Boolean(toggles.travel_enabled)}
                    onCheckedChange={(val) => handleToggleChange("travel_enabled", val)}
                  />
                </div>

                <div className="flex items-center justify-between p-4 bg-sidebar rounded-xl border border-sidebar-border">
                  <div>
                    <p className="text-sm font-semibold text-foreground">Food / Meal Allowance</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {toggles.food_enabled ? "Included on invoices" : "Excluded from invoices"}
                    </p>
                  </div>
                  <Switch
                    checked={Boolean(toggles.food_enabled)}
                    onCheckedChange={(val) => handleToggleChange("food_enabled", val)}
                  />
                </div>

                <div className="flex items-center justify-between p-4 bg-sidebar rounded-xl border border-sidebar-border">
                  <div>
                    <p className="text-sm font-semibold text-foreground">Stay / Accommodation</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {toggles.stay_enabled ? "Included on invoices" : "Excluded from invoices"}
                    </p>
                  </div>
                  <Switch
                    checked={Boolean(toggles.stay_enabled)}
                    onCheckedChange={(val) => handleToggleChange("stay_enabled", val)}
                  />
                </div>

                <div className="flex items-center justify-between p-4 bg-sidebar rounded-xl border border-sidebar-border">
                  <div>
                    <p className="text-sm font-semibold text-foreground">Miscellaneous Claims</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {toggles.miscellaneous_enabled ? "Included on invoices" : "Excluded from invoices"}
                    </p>
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
                              className="h-6 w-6 p-0 hover:bg-muted text-muted-foreground"
                              title="Edit region"
                              onClick={() => handleOpenEditRegion(region)}
                            >
                              <Pencil className="w-3.5 h-3.5" />
                            </Button>
                          </div>
                          {region.is_active === false && (
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
              <Input type="text" value={editRuleForm.name} disabled className="bg-muted" />
            </div>

            {selectedRule?.key === "road" && (
              <>
                <div>
                  <Label className="text-xs uppercase font-semibold">Calculation</Label>
                  <Input value="Travel Formula (€ / km)" disabled className="bg-muted mt-1" />
                </div>
                <div>
                  <Label className="text-xs uppercase font-semibold">Rate per km (€)</Label>
                  <Input
                    type="number"
                    step="0.0001"
                    value={editRuleForm.rate_per_km}
                    onChange={(e) =>
                      setEditRuleForm({ ...editRuleForm, rate_per_km: parseFloat(e.target.value) })
                    }
                  />
                </div>
              </>
            )}

            {selectedRule?.key === "food" && (
              <div>
                <Label className="text-xs uppercase font-semibold">Daily Fixed Rate (€)</Label>
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  value={editRuleForm.daily_rate}
                  onChange={(e) => {
                    const raw = e.target.value;
                    setEditRuleForm({
                      ...editRuleForm,
                      daily_rate: raw === "" ? 0 : Number(raw),
                    });
                  }}
                />
              </div>
            )}

            {selectedRule?.key === "accommodation" && (
              <div>
                <Label className="text-xs uppercase font-semibold">Max Nightly Rate (€)</Label>
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  value={editRuleForm.max_nightly_rate}
                  onChange={(e) => {
                    const raw = e.target.value;
                    setEditRuleForm({
                      ...editRuleForm,
                      max_nightly_rate: raw === "" ? 0 : Number(raw),
                    });
                  }}
                />
              </div>
            )}

            {(selectedRule?.key === "rail" || selectedRule?.key === "flight") && (
              <div>
                <Label className="text-xs uppercase font-semibold">Calculation</Label>
                <Input value="Actual cost (receipt based)" disabled className="bg-muted mt-1" />
              </div>
            )}

            {/* Proof / document required — Food, Accommodation, Travel modes, Misc */}
            <div className="flex items-center justify-between p-3.5 bg-sidebar rounded-xl border">
              <div>
                <p className="text-sm font-semibold">Document Required (Receipt Upload)</p>
                <p className="text-[11px] text-muted-foreground mt-0.5">
                  Teacher must attach proof when this section has an amount
                </p>
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
            <Button onClick={handleSaveRule} disabled={updateDefaultsMutation.isPending}>
              {updateDefaultsMutation.isPending ? "Saving..." : "Save Rule Configuration"}
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
                    checked={editRegionForm.is_active}
                    onCheckedChange={(val) => setEditRegionForm({ ...editRegionForm, is_active: val })}
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

                <div className="space-y-2">
                  <Label className="text-[11px] font-semibold text-foreground">Travel pricing</Label>
                  <Select
                    value={editRegionForm.travel_pricing_mode || "PER_KM"}
                    onValueChange={(val) =>
                      setEditRegionForm({ ...editRegionForm, travel_pricing_mode: val })
                    }
                  >
                    <SelectTrigger className="h-9 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="PER_KM">Per km (distance formula)</SelectItem>
                      <SelectItem value="FIXED_PER_SESSION">Fixed rate per session</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {editRegionForm.travel_pricing_mode === "FIXED_PER_SESSION" ? (
                  <div>
                    <Label className="text-[11px] text-muted-foreground">
                      Fixed rate per session (€)
                    </Label>
                    <Input
                      type="number"
                      step="0.01"
                      min="0"
                      placeholder="e.g. 50.00"
                      value={editRegionForm.travel_fixed_session_rate}
                      onChange={(e) =>
                        setEditRegionForm({
                          ...editRegionForm,
                          travel_fixed_session_rate: e.target.value,
                        })
                      }
                      className="font-mono text-xs mt-1"
                    />
                    <p className="text-[10px] text-muted-foreground mt-1">
                      Charged once per teaching session (no km calculation).
                    </p>
                  </div>
                ) : (
                  <div>
                    <Label className="text-[11px] text-muted-foreground">
                      Travel Rate per km (€) [Baseline: €0.4326]
                    </Label>
                    <Input
                      type="number"
                      step="0.0001"
                      placeholder="Inherit Global (€0.4326/km)"
                      value={editRegionForm.travel_rate}
                      onChange={(e) =>
                        setEditRegionForm({ ...editRegionForm, travel_rate: e.target.value })
                      }
                      className="font-mono text-xs mt-1"
                    />
                  </div>
                )}

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
