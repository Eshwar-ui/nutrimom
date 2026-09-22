import 'package:flutter_test/flutter_test.dart';
import 'package:nurture_moms/src/contracts/enums.dart';

/// The Dart half of the contract guard.
///
/// This file pins the wire values this build understands.
/// `scripts/check-mobile-contract.mjs` reads the same values out of
/// `packages/shared/src/index.ts` and fails when the two sets differ — so a
/// value added to the API without being added here is caught in CI rather than
/// by a person seeing a blank status chip.
void main() {
  group('wire values', () {
    test('Role', () {
      expect(Role.values.map((e) => e.wire), ['CUSTOMER', 'ADMIN']);
    });

    test('Condition', () {
      expect(Condition.values.map((e) => e.wire), ['NEW', 'LIKE_NEW', 'GOOD', 'FAIR']);
      expect(Condition.isNew.label, 'New with tags');
    });

    test('DeliveryOption', () {
      expect(DeliveryOption.values.map((e) => e.wire), ['PICKUP', 'DELIVERY', 'BOTH']);
    });

    test('ListingStatus', () {
      expect(
        ListingStatus.values.map((e) => e.wire),
        ['PENDING', 'APPROVED', 'REJECTED', 'RESERVED', 'SOLD'],
      );
    });

    test('OrderStatus', () {
      expect(
        OrderStatus.values.map((e) => e.wire),
        ['PENDING', 'PAID', 'SHIPPED', 'DELIVERED', 'CANCELLED'],
      );
    });

    test('PaymentMethod keeps the retired COD value parseable', () {
      expect(PaymentMethod.values.map((e) => e.wire), ['COD', 'ONLINE']);
      expect(PaymentMethod.parse('COD'), PaymentMethod.cod);
    });

    test('MembershipPlan carries the published plan table', () {
      expect(
        MembershipPlan.values.map((e) => e.wire),
        ['MONTHLY', 'QUARTERLY', 'HALF_YEARLY', 'YEARLY'],
      );
      expect(MembershipPlan.monthly.priceInPaise, 9900);
      expect(MembershipPlan.quarterly.priceInPaise, 19900);
      expect(MembershipPlan.halfYearly.priceInPaise, 49900);
      expect(MembershipPlan.yearly.priceInPaise, 99900);
      expect(MembershipPlan.yearly.durationDays, 365);
      expect(MembershipPlan.yearly.bestValue, isTrue);
    });

    test('ShipmentStatus', () {
      expect(
        ShipmentStatus.values.map((e) => e.wire),
        ['PENDING', 'LABEL_GENERATED', 'SHIPPED', 'DELIVERED'],
      );
      expect(ShipmentStatus.pending.label, 'Awaiting label');
    });

    test('PayoutStatus', () {
      expect(
        PayoutStatus.values.map((e) => e.wire),
        ['PENDING', 'PAYABLE', 'PAID', 'CANCELLED'],
      );
      expect(PayoutStatus.pending.label, 'On hold');
    });

    test('NotificationType covers all nine events', () {
      expect(NotificationType.values.map((e) => e.wire), [
        'LISTING_APPROVED',
        'LISTING_REJECTED',
        'ITEM_SOLD',
        'ORDER_PLACED',
        'ORDER_CANCELLED',
        'PAYMENT_REFUNDED',
        'SELLER_REGISTERED',
        'MEMBERSHIP_EXPIRING',
        'MEMBERSHIP_EXPIRED',
      ]);
    });

    test('BlogCategory carries value, slug and label', () {
      expect(BlogCategory.values.map((e) => e.wire), [
        'PREGNANCY', 'YOGA', 'POSTPARTUM', 'NUTRITION', 'STARTING_SOLIDS',
        'BABY', 'TODDLER', 'MOTHERHOOD', 'MOMPRENEUR', 'PRELOVED',
      ]);
      // The slug is a URL contract, independent of the label.
      expect(BlogCategory.startingSolids.slug, 'starting-solids');
      expect(BlogCategory.startingSolids.label, 'Starting Solids');
      expect(BlogCategory.fromSlug('starting-solids'), BlogCategory.startingSolids);
      expect(BlogCategory.tryParse(null), isNull);
    });

    test('ContactMessageStatus', () {
      expect(
        ContactMessageStatus.values.map((e) => e.wire),
        ['NEW', 'READ', 'RESPONDED'],
      );
    });
  });

  group('parsing', () {
    test('parse throws ContractDriftException on an unknown value', () {
      expect(
        () => OrderStatus.parse('REFUNDED'),
        throwsA(isA<ContractDriftException>()),
      );
    });

    test('tryParse returns null rather than throwing', () {
      expect(NotificationType.tryParse('SOMETHING_NEW'), isNull);
      expect(NotificationType.tryParse(null), isNull);
      expect(NotificationType.tryParse('ITEM_SOLD'), NotificationType.itemSold);
    });
  });

  group('order labels', () {
    test('mirror orderStatusLabel, including the retired COD case', () {
      expect(orderStatusLabel(OrderStatus.pending), 'Awaiting payment');
      expect(
        orderStatusLabel(OrderStatus.pending, PaymentMethod.cod),
        'Order placed',
      );
      expect(orderStatusLabel(OrderStatus.paid), 'Paid');
      expect(orderStatusLabel(OrderStatus.cancelled), 'Cancelled');
    });

    test('mirror isOrderConfirmed', () {
      expect(isOrderConfirmed(OrderStatus.pending), isFalse);
      expect(isOrderConfirmed(OrderStatus.pending, PaymentMethod.cod), isTrue);
      expect(isOrderConfirmed(OrderStatus.paid), isTrue);
      expect(isOrderConfirmed(OrderStatus.cancelled), isFalse);
      expect(isOrderConfirmed(OrderStatus.cancelled, PaymentMethod.cod), isFalse);
    });
  });
}
