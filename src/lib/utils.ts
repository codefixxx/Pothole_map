import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export const getValidDomains = ()=>{
    const domains=["gmail.com","outlook.com","yahoo.com"]
    if(process.env.NODE_ENV === "development"){
        domains.push("expample.com")
    }
    return domains
}

export const normalizeName = (name: string) => {
  return name
    .trim()
    .toLowerCase()
     .replace(/[^a-zA-Z\s'-]/g, "")
    .split(/\s+/) // handles multiple spaces
    .map(word =>
      word.charAt(0).toUpperCase() + word.slice(1)
    )
    .join(" ");
};
 