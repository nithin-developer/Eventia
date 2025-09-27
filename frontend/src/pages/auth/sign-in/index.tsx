import { UserAuthForm } from "./components/user-auth-form";
import Silk from "@/components/aurora";
import { IconReportMedical } from "@tabler/icons-react";
import CircularText from "@/components/curvedloop";

export default function SignIn2() {
  return (
    <div className="relative container grid h-svh flex-col items-center justify-center lg:max-w-none lg:grid-cols-2 lg:px-0">
      <div className="bg-muted relative hidden h-full flex-col p-10 text-white lg:flex dark:border-r">
        <div className="absolute inset-0">
          <Silk
            speed={5}
            scale={1}
            color="#5227ff"
            noiseIntensity={1.5}
            rotation={0}
          />
        </div>
        <div className="relative z-20 flex items-center text-lg font-medium">
          <IconReportMedical className="mr-2 h-6 w-6" />
          Vidyavardhaka College of Engineering
        </div>

        {/* <img
          src="https://dynamic.design.com/asset/logo/a18a548f-c917-404c-8a57-7c30b0e7aa54/logo-search-grid-2x?logoTemplateVersion=2&v=638879732415700000&text=Healthcare+DMS&layout=auto"
          className="relative m-auto"
          width={301}
          height={60}
          alt="Vite"
        /> */}

        <div className="relative z-20 mt-auto flex flex-col items-center space-y-4">
          <CircularText
            text="VIDYAVARDHAKA☆COLLEGE☆ENGINEERING☆"
            onHover="speedUp"
            spinDuration={20}
            className="custom-class"
          />
        </div>

        <div className="relative z-20 mt-auto">
          <div className="space-y-4">
            <h2 className="text-3xl font-bold leading-tight">
              Welcome to Professional Healthcare Management
            </h2>
            <p className="text-lg text-white/90 leading-relaxed">
              Streamline your healthcare operations with our comprehensive
              document management system. Secure, efficient, and designed for
              healthcare professionals.
            </p>
            <div className="flex items-center space-x-4 text-sm text-white/80">
              <div className="flex items-center">
                <div className="w-2 h-2 bg-green-400 rounded-full mr-2"></div>
                HIPAA Compliant
              </div>
              <div className="flex items-center">
                <div className="w-2 h-2 bg-blue-400 rounded-full mr-2"></div>
                24/7 Support
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="lg:p-8">
        <div className="mx-auto flex w-full flex-col justify-center space-y-2 sm:w-[350px]">
          <div className="flex flex-col space-y-2 text-left mb-4">
            <h1 className="text-2xl font-semibold tracking-tight">Login</h1>
            <p className="text-muted-foreground text-sm">
              Enter your email and password below <br />
              to log into your account
            </p>
          </div>
          <UserAuthForm />
          <p className="text-muted-foreground px-8 text-center text-sm mt-4">
            By clicking login, you agree to our{" "}
            <a
              href="/terms"
              className="hover:text-primary underline underline-offset-4"
            >
              Terms of Service
            </a>{" "}
            and{" "}
            <a
              href="/privacy"
              className="hover:text-primary underline underline-offset-4"
            >
              Privacy Policy
            </a>
            .
          </p>
        </div>
      </div>
    </div>
  );
}
