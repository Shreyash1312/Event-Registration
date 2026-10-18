
import { Suspense } from "react";
import RegisterForm from "./RegisterForm";

type Props = {
  params: Promise<{ token: string }>;
};

async function RegistrationPage({ params }: Props) {
  const { token } = await params;
  return <RegisterForm token={token} />;
}

export default function Page({ params }: Props) {
  return (
    <Suspense
      fallback={
        <main className="min-h-screen flex items-center justify-center">
          Loading registration form...
        </main>
      }
    >
      <RegistrationPage params={params} />
    </Suspense>
  );
}
