'use client';

import { useState } from 'react';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

import { Listing, formatSTX, formatAddress, blockHeightToTimestamp } from '@/lib/stacks';
import { ShoppingCart, Clock, User, Package } from 'lucide-react';
import Image from 'next/image';

interface ListingCardProps {
  listing: Listing;
  onPurchase?: (listingId: number) => void;
  onCancel?: (listingId: number) => void;
  isOwner?: boolean;
}

export default function ListingCard({ listing, onPurchase, onCancel, isOwner }: ListingCardProps) {
  const [isPurchasing, setIsPurchasing] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);
  
  // For demo purposes: use placeholder image if no imageUrl provided
  const displayImage = listing.imageUrl || `https://picsum.photos/seed/${listing.listingId}/400/300`;

  const handlePurchase = async () => {
    if (onPurchase) {
      setIsPurchasing(true);
      try {
        await onPurchase(listing.listingId);
      } finally {
        setIsPurchasing(false);
      }
    }
  };

  const handleCancel = async () => {
    if (onCancel) {
      setIsCancelling(true);
      try {
        await onCancel(listing.listingId);
      } finally {
        setIsCancelling(false);
      }
    }
  };

  // Convert block heights to timestamps for display
  const expiresAtTimestamp = blockHeightToTimestamp(listing.expiresAt);
  const isExpired = expiresAtTimestamp < Date.now();

  return (
    <Card className="h-full flex flex-col hover:shadow-xl transition-all hover:-translate-y-1 bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700">
      {/* Image Section */}
      <div className="relative w-full h-48 bg-slate-100 dark:bg-slate-700">
        <Image
          src={displayImage}
          alt={listing.name}
          fill
          className="object-cover rounded-t-lg"
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          unoptimized
        />
      </div>

      <CardHeader>
        <div className="flex items-start justify-between">
          <CardTitle className="text-lg line-clamp-2 text-slate-900 dark:text-white">{listing.name}</CardTitle>
          <Badge variant={listing.status === 'active' ? 'default' : 'secondary'} className={listing.status === 'active' ? 'bg-green-500 dark:bg-green-600' : ''}>
            {listing.status}
          </Badge>
        </div>
        <div className="flex items-center space-x-2 text-sm text-slate-600 dark:text-slate-400">
          <User className="h-4 w-4" />
          <span>{formatAddress(listing.seller)}</span>
        </div>
      </CardHeader>

      <CardContent className="flex-1">
        <p className="text-slate-700 dark:text-slate-300 text-sm mb-4 line-clamp-3">
          {listing.description}
        </p>

        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              {formatSTX(listing.price)} STX
            </span>
          </div>

          <div className="flex items-center space-x-2 text-sm text-slate-500 dark:text-slate-400">
            <Clock className="h-4 w-4" />
            <span>
              Expires: {new Date(expiresAtTimestamp).toLocaleDateString()}
            </span>
          </div>

          {isExpired && (
            <Badge variant="destructive" className="text-xs bg-red-500 dark:bg-red-600">
              Expired
            </Badge>
          )}
        </div>
      </CardContent>

      <CardFooter className="flex-col gap-2 pt-4">
        {!isOwner && listing.status === 'active' && !isExpired && (
          <Button
            onClick={handlePurchase}
            disabled={isPurchasing}
            className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white border-0"
          >
            <ShoppingCart className="h-4 w-4 mr-2" />
            {isPurchasing ? 'Purchasing...' : 'Purchase'}
          </Button>
        )}

        {isOwner && listing.status === 'active' && !isExpired && (
          <div className="w-full space-y-2">
            <div className="text-center text-sm text-blue-600 dark:text-blue-400 mb-2 font-medium">
              Your listing
            </div>
            <Button
              onClick={handleCancel}
              disabled={isCancelling}
              variant="destructive"
              className="w-full bg-red-500 hover:bg-red-600 dark:bg-red-600 dark:hover:bg-red-700"
              size="sm"
            >
              {isCancelling ? 'Cancelling...' : 'Cancel Listing'}
            </Button>
          </div>
        )}

        {isOwner && (listing.status !== 'active' || isExpired) && (
          <div className="w-full text-center text-sm text-slate-500 dark:text-slate-400">
            Your listing ({isExpired ? 'expired' : listing.status})
          </div>
        )}

        {(isExpired || listing.status !== 'active') && !isOwner && (
          <div className="w-full text-center text-sm text-slate-500 dark:text-slate-400">
            Not available
          </div>
        )}
      </CardFooter>
    </Card>
  );
}
// w-full
// aspect-ratio
// flex-col
// min-h-[44px]
