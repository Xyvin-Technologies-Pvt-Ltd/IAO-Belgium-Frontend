import { useLanguageStore } from "@/store/useLanguageStore";

const PageHeading = ({
  title,
  subtitle,
  userName = "Maria",
  showWelcome = true,
}) => {
  const { t } = useLanguageStore();

  const defaultTitle = showWelcome
    ? t?.dashboard?.welcome || `Welcome back, ${userName}!`
    : title;

  const defaultSubtitle = showWelcome
    ? t?.dashboard?.subtitle ||
      "You can find all the details regarding your application in the dashboard below"
    : subtitle;

  return (
    <div className="px-15 mt-8 space-y-2">
      <h1 className="text-4xl font-semibold">{title || defaultTitle}</h1>
      <p className="text-muted-foreground text-lg">
        {subtitle || defaultSubtitle}
      </p>
    </div>
  );
};

export default PageHeading;
