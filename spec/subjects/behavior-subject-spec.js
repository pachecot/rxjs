/* globals describe, it, expect */
var Rx = require('../../dist/cjs/Rx');

var BehaviorSubject = Rx.BehaviorSubject;
var nextTick = Rx.Scheduler.nextTick;

describe('BehaviorSubject', function () {
  it('should extend Subject', function (done) {
    var subject = new BehaviorSubject(null);
    expect(subject instanceof Rx.Subject).toBe(true);
    done();
  });

  it('should start with an initialization value', function (done) {
    var subject = new BehaviorSubject('foo');
    var expected = ['foo', 'bar'];
    var i = 0;

    subject.subscribe(function (x) {
      expect(x).toBe(expected[i++]);
    }, null, done);

    subject.next('bar');
    subject.complete();
  });

  it('should pump values to multiple subscribers', function (done) {
    var subject = new BehaviorSubject('init');
    var expected = ['init', 'foo', 'bar'];
    var i = 0;
    var j = 0;

    subject.subscribe(function (x) {
      expect(x).toBe(expected[i++]);
    });

    subject.subscribe(function (x) {
      expect(x).toBe(expected[j++]);
    }, null, done);

    expect(subject.observers.length).toBe(2);
    subject.next('foo');
    subject.next('bar');
    subject.complete();
  });

  it('should not allow values to be nexted after a return', function (done) {
    var subject = new BehaviorSubject('init');
    var expected = ['init', 'foo'];

    subject.subscribe(function (x) {
      expect(x).toBe(expected.shift());
    }, null, done);

    subject.next('foo');
    subject.complete();
    subject.next('bar');
  });

  it('should clean out unsubscribed subscribers', function (done) {
    var subject = new BehaviorSubject('init');

    var sub1 = subject.subscribe(function (x) {
      expect(x).toBe('init');
    });

    var sub2 = subject.subscribe(function (x) {
      expect(x).toBe('init');
    });

    expect(subject.observers.length).toBe(2);
    sub1.unsubscribe();
    expect(subject.observers.length).toBe(1);
    sub2.unsubscribe();
    expect(subject.observers.length).toBe(0);
    done();
  });

  it('should replay the previous value when subscribed', function () {
    var behaviorSubject = new BehaviorSubject('0');
    function feedNextIntoSubject(x) { behaviorSubject.next(x); }
    function feedErrorIntoSubject(err) { behaviorSubject.error(err); }
    function feedCompleteIntoSubject() { behaviorSubject.complete(); }

    var sourceTemplate =  '-1-2-3----4------5-6---7--8----9--|';
    var subscriber1 = hot('      (a|)                         ').mergeMapTo(behaviorSubject);
    var unsub1 =          '                     !             ';
    var expected1   =     '      3---4------5-6--             ';
    var subscriber2 = hot('            (b|)                   ').mergeMapTo(behaviorSubject);
    var unsub2 =          '                         !         ';
    var expected2   =     '            4----5-6---7--         ';
    var subscriber3 = hot('                           (c|)    ').mergeMapTo(behaviorSubject);
    var expected3   =     '                           8---9--|';

    expectObservable(hot(sourceTemplate).do(
      feedNextIntoSubject, feedErrorIntoSubject, feedCompleteIntoSubject
    )).toBe(sourceTemplate);
    expectObservable(subscriber1, unsub1).toBe(expected1);
    expectObservable(subscriber2, unsub2).toBe(expected2);
    expectObservable(subscriber3).toBe(expected3);
  });

  it('should emit complete when subscribed after completed', function () {
    var behaviorSubject = new BehaviorSubject('0');
    function feedNextIntoSubject(x) { behaviorSubject.next(x); }
    function feedErrorIntoSubject(err) { behaviorSubject.error(err); }
    function feedCompleteIntoSubject() { behaviorSubject.complete(); }

    var sourceTemplate =  '-1-2-3--4--|';
    var subscriber1 = hot('               (a|)').mergeMapTo(behaviorSubject);
    var expected1   =     '               |   ';

    expectObservable(hot(sourceTemplate).do(
      feedNextIntoSubject, feedErrorIntoSubject, feedCompleteIntoSubject
    )).toBe(sourceTemplate);
    expectObservable(subscriber1).toBe(expected1);
  });
});