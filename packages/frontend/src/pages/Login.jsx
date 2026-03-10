import ErrorBoundary from "@/components/shared/ErrorBoundary"
import * as React from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { useNavigate, useLocation } from "react-router-dom"
import { Wrench, Eye, EyeOff, Loader2 } from "lucide-react"
import { useAuth } from "@/lib/auth"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { toast } from "sonner"

const loginSchema = z.object({
  username: z.string().min(1, "Username is required"),
  password: z.string().min(1, "Password is required"),
})

export function LoginPage() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  
  const [showPassword, setShowPassword] = React.useState(false)
  const [error, setError] = React.useState(null)
  
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm({
    resolver: zodResolver(loginSchema),
    defaultValues: { username: "", password: "" }
  })

  // Get the redirect path if someone was bounced to login
  const from = location.state?.from?.pathname || "/"

  const onSubmit = async (data) => {
    setError(null)
    try {
      await login(data.username, data.password)
      navigate(from, { replace: true })
    } catch (err) {
      setError("Invalid username or password. Please try again.")
    }
  }

  return (
    <ErrorBoundary>
      <div className="min-h-screen w-full flex items-center justify-center bg-slate-50 sm:bg-muted sm:bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] sm:from-slate-100 sm:via-slate-50 sm:to-slate-200 p-4 sm:p-6 md:p-8">
      <div className="w-full max-w-md bg-background rounded-3xl sm:shadow-[0_8px_30px_rgb(0,0,0,0.08)] sm:border sm:border-slate-200 p-6 sm:p-10 animate-in fade-in zoom-in-95 duration-500">
        
        <div className="flex flex-col items-center justify-center space-y-4 mb-10">
          <div className="w-24 h-24 sm:w-28 sm:h-28 bg-white rounded-3xl flex items-center justify-center shadow-md border border-slate-100 p-3 overflow-hidden">
            <img src="/Favicon.png" alt="Company Logo" className="w-full h-full object-contain drop-shadow-sm" />
          </div>
          <div className="text-center space-y-1.5">
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 leading-tight">Jassem Alblooshi<br/><span className="text-xl sm:text-2xl text-blue-700">Technical Services L.L.C</span></h1>
            <p className="text-sm font-medium text-slate-500 uppercase tracking-widest mt-2 block">Warehouse System</p>
          </div>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          <div className="space-y-2">
            <Label htmlFor="username" className="text-slate-700 font-semibold">Username</Label>
            <Input 
              id="username" 
              placeholder="admin" 
              {...register("username")} 
              className="h-12 text-base px-4 bg-slate-50 border-slate-200 focus-visible:ring-blue-500 focus-visible:border-blue-500 transition-shadow rounded-xl shadow-sm"
            />
            {errors.username && <p className="text-xs text-red-500 font-medium px-1">{errors.username.message}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="password" className="text-slate-700 font-semibold">Password</Label>
            <div className="relative">
              <Input 
                id="password" 
                type={showPassword ? "text" : "password"} 
                {...register("password")} 
                className="h-12 text-base px-4 pr-11 bg-slate-50 border-slate-200 focus-visible:ring-blue-500 focus-visible:border-blue-500 transition-shadow rounded-xl shadow-sm" 
              />
              <button 
                type="button" 
                className="absolute right-3 top-3.5 text-slate-400 hover:text-slate-600 transition-colors focus:outline-none"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
            {errors.password && <p className="text-xs text-red-500 font-medium px-1">{errors.password.message}</p>}
          </div>

          {error && (
            <div className="p-3 bg-red-50 border border-red-100 text-red-600 text-sm font-medium rounded-lg text-center animate-in shake">
              {error}
            </div>
          )}

          <Button type="submit" disabled={isSubmitting} className="w-full h-12 rounded-xl bg-blue-600 hover:bg-blue-700 text-base font-bold shadow-md hover:shadow-lg transition-all mt-6">
            {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : "Sign In to Dashboard"}
          </Button>
        </form>

        <div className="mt-8 text-center text-xs text-slate-400 font-medium">
          Access is restricted to authorized personnel only.
        </div>
      </div>
    </div>
    </ErrorBoundary>
  )
}
