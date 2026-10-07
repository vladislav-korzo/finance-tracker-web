type PlaceholderScreenProps = {
  title: string;
  description?: string;
};

export function PlaceholderScreen(props: PlaceholderScreenProps) {
  const { title, description = 'Раздел скоро появится.' } = props;
  return (
    <div className="flex min-h-[40vh] flex-col items-center justify-center text-center">
      <h2 className="text-xl font-semibold text-foreground">{title}</h2>
      <p className="mt-2 max-w-sm text-sm text-muted-foreground">{description}</p>
    </div>
  );
}
