export interface User {
    user_id: string;
    name: string;
    email: string;
    address: string | null;
    phone: string | null;
    password: string | null;
    is_business_owner: boolean | null;
    business_name: string | null;
    business_address: string | null;
    business_type: string | null;
    product_service: string | null;
    business_experience: string | null;
    business_description: string | null;
    is_registered: boolean | null;
    isbusinessowner: boolean | null;
    photo: string | null;
    categories: string[];
    whatsapp: string | null;
    rating: number | null;
    vendor_id: number | null;
  }