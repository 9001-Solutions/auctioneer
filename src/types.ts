export interface Auction {
  id: number;
  guild_id: string;
  channel_id: string;
  thread_id: string | null;
  message_id: string | null;
  type: 'dkp' | 'gil';
  item_name: string;
  image_url: string | null;
  starting_bid: number | null;
  current_bid: number | null;
  current_bidder_id: string | null;
  duration_hours: number;
  created_at: string;
  closes_at: string;
  status: 'open' | 'closed' | 'cancelled';
  winner_id: string | null;
  winner_name: string | null;
  winning_value: string | null;
  dkp_column: string | null;
  min_increment: number | null;
}

export interface Bid {
  id: number;
  auction_id: number;
  user_id: string;
  user_name: string;
  amount: number | null;
  created_at: string;
}

export interface SheetMember {
  name: string;
  status: string;
  dkp: number;
}

export interface ResolvedBidder extends SheetMember {
  userId: string;
  userName: string;
}

export interface CreateAuctionData {
  guild_id: string;
  channel_id: string;
  thread_id: string | null;
  message_id: string | null;
  type: 'dkp' | 'gil';
  item_name: string;
  image_url: string | null;
  starting_bid: number | null;
  current_bid: number | null;
  current_bidder_id: string | null;
  duration_hours: number;
  closes_at: string;
  dkp_column: string | null;
  min_increment: number | null;
}

export interface PlaceBidData {
  auction_id: number;
  user_id: string;
  user_name: string;
  amount: number | null;
}
