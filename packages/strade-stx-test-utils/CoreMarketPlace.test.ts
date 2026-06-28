import { describe, expect, it } from "vitest";
import { Cl } from "@stacks/transactions";

const CONTRACT_NAME = 'CoreMarketPlace';
const LISTING_NAME = 'Test Item';
const LISTING_DESCRIPTION = 'A test item for sale';
const LISTING_PRICE = 1000000; // 1 STX in micro-STX
const LISTING_DURATION = 144; // ~1 day in blocks

// Helper function to create string arguments
const utf8 = (str: string) => Cl.stringUtf8(str);

describe("CoreMarketPlace Contract Tests", () => {
  
  it("ensures that contract initializes correctly", () => {
    const { result } = simnet.callReadOnlyFn(
      CONTRACT_NAME,
      'get-last-listing-id',
      [],
      simnet.deployer
    );
    
    expect(result).toBeOk(Cl.uint(0));
  });

  it("ensures that users can create a listing with valid parameters", () => {
    const seller = simnet.getAccounts().get('wallet_1')!;
    
    const { result } = simnet.callPublicFn(
      CONTRACT_NAME,
      'create-listing',
      [
        utf8(LISTING_NAME),
        utf8(LISTING_DESCRIPTION),
        Cl.uint(LISTING_PRICE),
        Cl.uint(LISTING_DURATION)
      ],
      seller
    );
    
    expect(result).toBeOk(Cl.uint(1));
    
    // Verify the listing was created correctly
    const { result: listingResult } = simnet.callReadOnlyFn(
      CONTRACT_NAME,
      'get-listing',
      [Cl.uint(1)],
      seller
    );
    
    // Check that the result is Some (not None)
    expect(listingResult).not.toBeNone();
  });

  it("ensures that creating a listing with zero price fails", () => {
    const seller = simnet.getAccounts().get('wallet_1')!;
    
    const { result } = simnet.callPublicFn(
      CONTRACT_NAME,
      'create-listing',
      [
        utf8(LISTING_NAME),
        utf8(LISTING_DESCRIPTION),
        Cl.uint(0),
        Cl.uint(LISTING_DURATION)
      ],
      seller
    );
    
    expect(result).toBeErr(Cl.error(Cl.uint(102))); // ERR_INVALID_PRICE
  });

  it("ensures that creating a listing with empty name fails", () => {
    const seller = simnet.getAccounts().get('wallet_1')!;
    
    const { result } = simnet.callPublicFn(
      CONTRACT_NAME,
      'create-listing',
      [
        utf8(''),
        utf8(LISTING_DESCRIPTION),
        Cl.uint(LISTING_PRICE),
        Cl.uint(LISTING_DURATION)
      ],
      seller
    );
    
    expect(result).toBeErr(Cl.error(Cl.uint(109))); // ERR_INVALID_INPUT
  });

  it("ensures that creating a listing with invalid duration fails", () => {
    const seller = simnet.getAccounts().get('wallet_1')!;
    
    const { result } = simnet.callPublicFn(
      CONTRACT_NAME,
      'create-listing',
      [
        utf8(LISTING_NAME),
        utf8(LISTING_DESCRIPTION),
        Cl.uint(LISTING_PRICE),
        Cl.uint(0)
      ],
      seller
    );
    
    expect(result).toBeErr(Cl.error(Cl.uint(110))); // ERR_INVALID_DURATION
  });

  it("ensures that creating a listing with duration exceeding max fails", () => {
    const seller = simnet.getAccounts().get('wallet_1')!;
    
    const { result } = simnet.callPublicFn(
      CONTRACT_NAME,
      'create-listing',
      [
        utf8(LISTING_NAME),
        utf8(LISTING_DESCRIPTION),
        Cl.uint(LISTING_PRICE),
        Cl.uint(52561)
      ],
      seller
    );
    
    expect(result).toBeErr(Cl.error(Cl.uint(110))); // ERR_INVALID_DURATION
  });

  it("ensures that seller can update their own listing", () => {
    const seller = simnet.getAccounts().get('wallet_1')!;
    const newPrice = 2000000;
    const newDescription = 'Updated description';
    
    // Create listing
    simnet.callPublicFn(
      CONTRACT_NAME,
      'create-listing',
      [
        utf8(LISTING_NAME),
        utf8(LISTING_DESCRIPTION),
        Cl.uint(LISTING_PRICE),
        Cl.uint(LISTING_DURATION)
      ],
      seller
    );
    
    // Update listing
    const { result } = simnet.callPublicFn(
      CONTRACT_NAME,
      'update-listing',
      [
        Cl.uint(1),
        Cl.uint(newPrice),
        utf8(newDescription)
      ],
      seller
    );
    
    expect(result).toBeOk(Cl.bool(true));
  });

  it("ensures that non-seller cannot update a listing", () => {
    const seller = simnet.getAccounts().get('wallet_1')!;
    const nonSeller = simnet.getAccounts().get('wallet_2')!;
    
    // Create listing
    simnet.callPublicFn(
      CONTRACT_NAME,
      'create-listing',
      [
        utf8(LISTING_NAME),
        utf8(LISTING_DESCRIPTION),
        Cl.uint(LISTING_PRICE),
        Cl.uint(LISTING_DURATION)
      ],
      seller
    );
    
    // Try to update as non-seller
    const { result } = simnet.callPublicFn(
      CONTRACT_NAME,
      'update-listing',
      [
        Cl.uint(1),
        Cl.uint(2000000),
        utf8('Hacked description')
      ],
      nonSeller
    );
    
    expect(result).toBeErr(Cl.error(Cl.uint(107))); // ERR_NOT_SELLER
  });

  it("ensures that seller can cancel their own listing", () => {
    const seller = simnet.getAccounts().get('wallet_1')!;
    
    // Create listing
    simnet.callPublicFn(
      CONTRACT_NAME,
      'create-listing',
      [
        utf8(LISTING_NAME),
        utf8(LISTING_DESCRIPTION),
        Cl.uint(LISTING_PRICE),
        Cl.uint(LISTING_DURATION)
      ],
      seller
    );
    
    // Cancel listing
    const { result } = simnet.callPublicFn(
      CONTRACT_NAME,
      'cancel-listing',
      [Cl.uint(1)],
      seller
    );
    
    expect(result).toBeOk(Cl.bool(true));
  });

  it("ensures that non-seller cannot cancel a listing", () => {
    const seller = simnet.getAccounts().get('wallet_1')!;
    const nonSeller = simnet.getAccounts().get('wallet_2')!;
    
    // Create listing
    simnet.callPublicFn(
      CONTRACT_NAME,
      'create-listing',
      [
        utf8(LISTING_NAME),
        utf8(LISTING_DESCRIPTION),
        Cl.uint(LISTING_PRICE),
        Cl.uint(LISTING_DURATION)
      ],
      seller
    );
    
    // Try to cancel as non-seller
    const { result } = simnet.callPublicFn(
      CONTRACT_NAME,
      'cancel-listing',
      [Cl.uint(1)],
      nonSeller
    );
    
    expect(result).toBeErr(Cl.error(Cl.uint(107))); // ERR_NOT_SELLER
  });

  it("ensures that buyer can purchase an active listing", () => {
    const seller = simnet.getAccounts().get('wallet_1')!;
    const buyer = simnet.getAccounts().get('wallet_2')!;
    
    // Create listing
    simnet.callPublicFn(
      CONTRACT_NAME,
      'create-listing',
      [
        utf8(LISTING_NAME),
        utf8(LISTING_DESCRIPTION),
        Cl.uint(LISTING_PRICE),
        Cl.uint(LISTING_DURATION)
      ],
      seller
    );
    
    // Purchase listing
    const { result } = simnet.callPublicFn(
      CONTRACT_NAME,
      'purchase-listing',
      [Cl.uint(1)],
      buyer
    );
    
    expect(result).toBeOk(Cl.bool(true));
  });

  it("ensures that purchasing a non-existent listing fails", () => {
    const buyer = simnet.getAccounts().get('wallet_2')!;
    
    const { result } = simnet.callPublicFn(
      CONTRACT_NAME,
      'purchase-listing',
      [Cl.uint(999)],
      buyer
    );
    
    expect(result).toBeErr(Cl.error(Cl.uint(111))); // ERR_INVALID_LISTING_ID
  });

  it("ensures that purchasing a cancelled listing fails", () => {
    const seller = simnet.getAccounts().get('wallet_1')!;
    const buyer = simnet.getAccounts().get('wallet_2')!;
    
    // Create listing
    simnet.callPublicFn(
      CONTRACT_NAME,
      'create-listing',
      [
        utf8(LISTING_NAME),
        utf8(LISTING_DESCRIPTION),
        Cl.uint(LISTING_PRICE),
        Cl.uint(LISTING_DURATION)
      ],
      seller
    );
    
    // Cancel listing
    simnet.callPublicFn(
      CONTRACT_NAME,
      'cancel-listing',
      [Cl.uint(1)],
      seller
    );
    
    // Try to purchase
    const { result } = simnet.callPublicFn(
      CONTRACT_NAME,
      'purchase-listing',
      [Cl.uint(1)],
      buyer
    );
    
    expect(result).toBeErr(Cl.error(Cl.uint(106))); // ERR_INVALID_STATUS
  });

  it("ensures that purchasing an already sold listing fails", () => {
    const seller = simnet.getAccounts().get('wallet_1')!;
    const buyer1 = simnet.getAccounts().get('wallet_2')!;
    const buyer2 = simnet.getAccounts().get('wallet_3')!;
    
    // Create listing
    simnet.callPublicFn(
      CONTRACT_NAME,
      'create-listing',
      [
        utf8(LISTING_NAME),
        utf8(LISTING_DESCRIPTION),
        Cl.uint(LISTING_PRICE),
        Cl.uint(LISTING_DURATION)
      ],
      seller
    );
    
    // First purchase
    simnet.callPublicFn(
      CONTRACT_NAME,
      'purchase-listing',
      [Cl.uint(1)],
      buyer1
    );
    
    // Second purchase attempt
    const { result } = simnet.callPublicFn(
      CONTRACT_NAME,
      'purchase-listing',
      [Cl.uint(1)],
      buyer2
    );
    
    expect(result).toBeErr(Cl.error(Cl.uint(106))); // ERR_INVALID_STATUS
  });

  it("ensures that purchasing an expired listing fails", () => {
    const seller = simnet.getAccounts().get('wallet_1')!;
    const buyer = simnet.getAccounts().get('wallet_2')!;
    const shortDuration = 5;
    
    // Create listing with short duration
    simnet.callPublicFn(
      CONTRACT_NAME,
      'create-listing',
      [
        utf8(LISTING_NAME),
        utf8(LISTING_DESCRIPTION),
        Cl.uint(LISTING_PRICE),
        Cl.uint(shortDuration)
      ],
      seller
    );
    
    // Mine blocks to expire the listing
    simnet.mineEmptyBlocks(shortDuration + 1);
    
    // Try to purchase expired listing
    const { result } = simnet.callPublicFn(
      CONTRACT_NAME,
      'purchase-listing',
      [Cl.uint(1)],
      buyer
    );
    
    expect(result).toBeErr(Cl.error(Cl.uint(105))); // ERR_LISTING_EXPIRED
  });

  it("ensures that updating a cancelled listing fails", () => {
    const seller = simnet.getAccounts().get('wallet_1')!;
    
    // Create listing
    simnet.callPublicFn(
      CONTRACT_NAME,
      'create-listing',
      [
        utf8(LISTING_NAME),
        utf8(LISTING_DESCRIPTION),
        Cl.uint(LISTING_PRICE),
        Cl.uint(LISTING_DURATION)
      ],
      seller
    );
    
    // Cancel listing
    simnet.callPublicFn(
      CONTRACT_NAME,
      'cancel-listing',
      [Cl.uint(1)],
      seller
    );
    
    // Try to update cancelled listing
    const { result } = simnet.callPublicFn(
      CONTRACT_NAME,
      'update-listing',
      [
        Cl.uint(1),
        Cl.uint(2000000),
        utf8('New description')
      ],
      seller
    );
    
    expect(result).toBeErr(Cl.error(Cl.uint(106))); // ERR_INVALID_STATUS
  });

  it("ensures that multiple listings can be created and tracked correctly", () => {
    const seller1 = simnet.getAccounts().get('wallet_1')!;
    const seller2 = simnet.getAccounts().get('wallet_2')!;
    
    // Create first listing
    const { result: result1 } = simnet.callPublicFn(
      CONTRACT_NAME,
      'create-listing',
      [
        utf8('Item 1'),
        utf8('First item'),
        Cl.uint(LISTING_PRICE),
        Cl.uint(LISTING_DURATION)
      ],
      seller1
    );
    
    // Create second listing
    const { result: result2 } = simnet.callPublicFn(
      CONTRACT_NAME,
      'create-listing',
      [
        utf8('Item 2'),
        utf8('Second item'),
        Cl.uint(LISTING_PRICE * 2),
        Cl.uint(LISTING_DURATION)
      ],
      seller2
    );
    
    // Create third listing
    const { result: result3 } = simnet.callPublicFn(
      CONTRACT_NAME,
      'create-listing',
      [
        utf8('Item 3'),
        utf8('Third item'),
        Cl.uint(LISTING_PRICE * 3),
        Cl.uint(LISTING_DURATION)
      ],
      seller1
    );
    
    expect(result1).toBeOk(Cl.uint(1));
    expect(result2).toBeOk(Cl.uint(2));
    expect(result3).toBeOk(Cl.uint(3));
    
    // Verify last listing ID
    const { result: lastId } = simnet.callReadOnlyFn(
      CONTRACT_NAME,
      'get-last-listing-id',
      [],
      seller1
    );
    
    expect(lastId).toBeOk(Cl.uint(3));
  });

  it("ensures that get-listing returns none for invalid listing ID", () => {
    const user = simnet.getAccounts().get('wallet_1')!;
    
    const { result } = simnet.callReadOnlyFn(
      CONTRACT_NAME,
      'get-listing',
      [Cl.uint(999)],
      user
    );
    
    expect(result).toBeNone();
  });

  it("ensures that updating with invalid price fails", () => {
    const seller = simnet.getAccounts().get('wallet_1')!;
    
    // Create listing
    simnet.callPublicFn(
      CONTRACT_NAME,
      'create-listing',
      [
        utf8(LISTING_NAME),
        utf8(LISTING_DESCRIPTION),
        Cl.uint(LISTING_PRICE),
        Cl.uint(LISTING_DURATION)
      ],
      seller
    );
    
    // Try to update with invalid price
    const { result } = simnet.callPublicFn(
      CONTRACT_NAME,
      'update-listing',
      [
        Cl.uint(1),
        Cl.uint(0),
        utf8('New description')
      ],
      seller
    );
    
    expect(result).toBeErr(Cl.error(Cl.uint(102))); // ERR_INVALID_PRICE
  });

  it("ensures that updating with empty description fails", () => {
    const seller = simnet.getAccounts().get('wallet_1')!;
    
    // Create listing
    simnet.callPublicFn(
      CONTRACT_NAME,
      'create-listing',
      [
        utf8(LISTING_NAME),
        utf8(LISTING_DESCRIPTION),
        Cl.uint(LISTING_PRICE),
        Cl.uint(LISTING_DURATION)
      ],
      seller
    );
    
    // Try to update with empty description
    const { result } = simnet.callPublicFn(
      CONTRACT_NAME,
      'update-listing',
      [
        Cl.uint(1),
        Cl.uint(2000000),
        utf8('')
      ],
      seller
    );
    
    expect(result).toBeErr(Cl.error(Cl.uint(109))); // ERR_INVALID_INPUT
  });
});
