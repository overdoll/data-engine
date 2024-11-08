import { FileUpload } from "./components/FileUpload"
import { FileList } from "./components/FileList"

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center p-24">
      <h1 className="text-4xl font-bold mb-8">Welcome to the Dataset Manager</h1>
      <div className="w-full max-w-2xl space-y-8">
        <FileUpload />
        <FileList />
      </div>
    </main>
  )
}
