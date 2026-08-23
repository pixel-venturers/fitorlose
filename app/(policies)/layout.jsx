export default function Layout({ children }) {
  return (
    <div className="prose prose-sm mx-auto my-10 dark:*:text-white dark:[&_strong]:text-white">
      {children}
    </div>
  );
}
