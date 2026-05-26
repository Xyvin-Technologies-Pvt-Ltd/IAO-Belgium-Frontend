import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useGetQuestionBanksDropdown } from "@/store/useQuestionBankStore";

const QuestionSourceSelector = ({ value = [], onChange, error, selectedLanguage }) => {
  const { t } = useTranslation();
  const { data: banksData } = useGetQuestionBanksDropdown(
    {
      status: true,
      ...(selectedLanguage ? { language: selectedLanguage } : {}),
    },
    {
      enabled: !!selectedLanguage,
    }
  );
  const banks = banksData?.data || [];

  const addSource = () => {
    onChange([...value, { question_bank: "", count: 1 }]);
  };

  const removeSource = (idx) => {
    onChange(value.filter((_, i) => i !== idx));
  };

  const updateSource = (idx, field, val) => {
    const next = [...value];
    next[idx] = { ...next[idx], [field]: val };
    onChange(next);
  };

  const totalQuestions = value.reduce((sum, s) => sum + (Number(s.count) || 0), 0);

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <Label>{t("exam.form.questionSources")} *</Label>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={addSource}
          disabled={!selectedLanguage}
        >
          <Plus className="h-4 w-4 mr-1" />
          {t("exam.form.addQuestionSource")}
        </Button>
      </div>
      {!selectedLanguage && (
        <p className="text-sm text-amber-600 dark:text-amber-400">
          Please select a language first to load question banks.
        </p>
      )}
      {value.map((src, idx) => (
        <div key={idx} className="flex gap-2 items-center p-3 border rounded-lg">
          <Select
            value={src.question_bank}
            onValueChange={(v) => updateSource(idx, "question_bank", v)}
          >
            <SelectTrigger className="flex-1">
              <SelectValue placeholder={t("exam.form.selectQuestionBank")} />
            </SelectTrigger>
            <SelectContent>
              {banks.map((b) => (
                <SelectItem key={b._id} value={b._id}>
                  {b.name} ({b.question_count ?? 0} {t("exam.form.questionsAvailable")})
                </SelectItem>
              ))}
              {banks.length === 0 && (
                <div className="p-2 text-sm text-muted-foreground">
                  {t("exam.form.noQuestionBanks")}
                </div>
              )}
            </SelectContent>
          </Select>
          <Input
            type="number"
            min={1}
            value={src.count ?? 1}
            onChange={(e) =>
              updateSource(idx, "count", Math.max(1, parseInt(e.target.value) || 1))
            }
            className="w-24"
          />
          <span className="text-sm text-muted-foreground">
            {t("exam.form.questions")}
          </span>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={() => removeSource(idx)}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      ))}
      {totalQuestions > 0 && (
        <p className="text-sm text-muted-foreground">
          {t("exam.form.totalQuestions")}: {totalQuestions}
        </p>
      )}
      {error && <p className="text-sm text-destructive">{error}</p>}
    </div>
  );
};

export default QuestionSourceSelector;
