import ThemeToggle from "@/components/ThemeToggle";

const Index = () => {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background text-foreground">
      <div className="absolute top-4 right-4">
        <ThemeToggle />
      </div>
      <h1 className="text-4xl font-bold">Welcome</h1>
      <p className="mt-2 text-muted-foreground">Click the icon in the top right to toggle dark mode.</p>
    </div>
  );
};

export default Index;
