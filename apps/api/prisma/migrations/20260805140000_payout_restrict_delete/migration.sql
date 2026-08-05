-- SellerPayout is a money ledger, and its foreign keys shipped as ON DELETE
-- CASCADE. Deleting an Order or a User would therefore erase both outstanding
-- debts and the audit record of transfers that already went out — the one
-- table where losing rows silently is least acceptable.
--
-- Switch both to RESTRICT, mirroring OrderItem's existing Restrict on Listing.
-- Deleting a seller who has payouts now fails loudly instead of quietly
-- destroying the record; settle or archive the payouts first.

ALTER TABLE "SellerPayout" DROP CONSTRAINT "SellerPayout_orderId_fkey";
ALTER TABLE "SellerPayout" DROP CONSTRAINT "SellerPayout_sellerId_fkey";

ALTER TABLE "SellerPayout" ADD CONSTRAINT "SellerPayout_orderId_fkey"
    FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "SellerPayout" ADD CONSTRAINT "SellerPayout_sellerId_fkey"
    FOREIGN KEY ("sellerId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
