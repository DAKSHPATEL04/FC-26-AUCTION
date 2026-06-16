export interface Player {
  _id: string;
  futdbId?: number;
  name: string;
  commonName?: string;
  image?: string;
  nation?: string;
  nationFlag?: string;
  club?: string;
  clubLogo?: string;
  league?: string;
  position: string;
  positionGroup: "GK" | "DEF" | "MID" | "FWD";
  rating: number;
  age?: number;
  height?: number;
  weight?: number;
  preferredFoot?: "Right" | "Left";
  weakFoot?: number;
  skillMoves?: number;
  pace?: number;
  shooting?: number;
  passing?: number;
  dribbling?: number;
  defending?: number;
  physical?: number;
  playStyles?: string[];
  status: "available" | "pool" | "sold" | "unsold";
  auctionPoolOrder?: number | null;
  soldTo?: { _id: string; teamName: string; logo?: string; color?: string } | null;
  soldPrice?: number | null;
  basePrice?: number;
}

export interface PlayersResponse {
  players: Player[];
  total: number;
  page: number;
  totalPages: number;
}

export interface PlayerFilters {
  search?: string;
  positionGroup?: string;
  position?: string;
  ratingMin?: number;
  ratingMax?: number;
  nation?: string;
  club?: string;
  league?: string;
  status?: string;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}
