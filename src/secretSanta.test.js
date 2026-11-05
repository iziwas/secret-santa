import { describe, expect, it } from 'vitest';
import { generateAssignments } from './secretSanta';

// Le tirage est aléatoire : chaque propriété est vérifiée sur de nombreux tirages.
const DRAWS = 200;
const PARTICIPANTS = ['Alice', 'Bob', 'Claire', 'David', 'Emma', 'Farid'];

const toMap = (assignments) =>
    Object.fromEntries(assignments.map(({ giver, receiver }) => [giver, receiver]));

describe('generateAssignments', () => {
    it('fait offrir et recevoir chaque participant exactement une fois', () => {
        for (let i = 0; i < DRAWS; i++) {
            const result = generateAssignments(PARTICIPANTS);
            const sorted = [...PARTICIPANTS].sort();

            expect(result.map(a => a.giver).sort()).toEqual(sorted);
            expect(result.map(a => a.receiver).sort()).toEqual(sorted);
        }
    });

    it("ne fait jamais offrir un participant à lui-même", () => {
        for (let i = 0; i < DRAWS; i++) {
            for (const { giver, receiver } of generateAssignments(PARTICIPANTS)) {
                expect(receiver).not.toBe(giver);
            }
        }
    });

    it('respecte les exclusions', () => {
        const exclusions = new Map([['Alice', ['Bob', 'Claire']], ['David', ['Emma']]]);

        for (let i = 0; i < DRAWS; i++) {
            const result = toMap(generateAssignments(PARTICIPANTS, exclusions));

            expect(exclusions.get('Alice')).not.toContain(result.Alice);
            expect(exclusions.get('David')).not.toContain(result.David);
        }
    });

    it("trouve l'unique tirage possible quand les exclusions n'en laissent qu'un", () => {
        const result = generateAssignments(['Alice', 'Bob', 'Claire'], new Map([['Alice', ['Claire']]]));

        expect(toMap(result)).toEqual({ Alice: 'Bob', Bob: 'Claire', Claire: 'Alice' });
    });

    it('fait échanger deux participants', () => {
        const result = generateAssignments(['Alice', 'Bob']);

        expect(toMap(result)).toEqual({ Alice: 'Bob', Bob: 'Alice' });
    });

    it('produit des tirages différents', () => {
        const seen = new Set();

        for (let i = 0; i < DRAWS; i++) {
            seen.add(generateAssignments(['Alice', 'Bob', 'Claire'])[0].receiver);
        }

        expect(seen).toEqual(new Set(['Bob', 'Claire']));
    });

    it('ignore les exclusions visant une personne absente', () => {
        const result = generateAssignments(['Alice', 'Bob'], new Map([['Alice', ['Zoé']], ['Zoé', ['Bob']]]));

        expect(toMap(result)).toEqual({ Alice: 'Bob', Bob: 'Alice' });
    });

    it('renvoie null quand aucun tirage ne respecte les exclusions', () => {
        expect(generateAssignments(['Alice', 'Bob'], new Map([['Alice', ['Bob']]]))).toBeNull();
        expect(generateAssignments(
            ['Alice', 'Bob', 'Claire'],
            new Map([['Alice', ['Claire']], ['Bob', ['Claire']]]),
        )).toBeNull();
    });

    it.each(['constructor', '__proto__', 'toString'])('accepte un participant nommé %s', (name) => {
        expect(toMap(generateAssignments([name, 'Bob']))).toEqual({ [name]: 'Bob', Bob: name });
        expect(generateAssignments([name, 'Bob'], new Map([[name, ['Bob']]]))).toBeNull();
    });

    it('ne modifie pas ses paramètres', () => {
        const participants = ['Alice', 'Bob', 'Claire'];
        const exclusions = new Map([['Alice', ['Bob']]]);

        generateAssignments(participants, exclusions);

        expect(participants).toEqual(['Alice', 'Bob', 'Claire']);
        expect(exclusions).toEqual(new Map([['Alice', ['Bob']]]));
    });
});

describe('generateAssignments avec des exclusions très contraignantes', () => {
    const names = (prefix, count) => Array.from({ length: count }, (_, i) => `${prefix}${i}`);

    // Personne ne peut offrir à un membre de son foyer.
    const twoHouseholds = (size) => {
        const households = [names('A', size), names('B', size)];
        const exclusions = new Map(households.flatMap(household =>
            household.map(person => [person, household.filter(other => other !== person)])
        ));
        return { households, participants: households.flat(), exclusions };
    };

    it('trouve toujours un tirage pour deux foyers de 10 personnes', () => {
        const { households: [householdA], participants, exclusions } = twoHouseholds(10);

        for (let i = 0; i < 50; i++) {
            const result = generateAssignments(participants, exclusions);

            expect(result.map(a => a.receiver).sort()).toEqual([...participants].sort());
            for (const { giver, receiver } of result) {
                expect(householdA.includes(giver)).not.toBe(householdA.includes(receiver));
            }
        }
    });

    it("trouve l'unique tirage possible parmi 12 participants", () => {
        const participants = names('P', 12);
        const successorOf = (i) => participants[(i + 1) % participants.length];
        const exclusions = new Map(participants.map((person, i) => [
            person,
            participants.filter(other => other !== person && other !== successorOf(i)),
        ]));

        expect(generateAssignments(participants, exclusions))
            .toEqual(participants.map((giver, i) => ({ giver, receiver: successorOf(i) })));
    });

    it("renvoie null quand deux participants n'ont qu'un seul et même receveur possible", () => {
        const participants = names('P', 20);
        const [first, second, onlyReceiver] = participants;
        const forbidden = participants.filter(other => other !== onlyReceiver);
        const exclusions = new Map([[first, forbidden], [second, forbidden]]);

        expect(generateAssignments(participants, exclusions)).toBeNull();
    });

    it('laisse sa chance à chaque receveur autorisé', () => {
        const { households: [householdA, householdB], participants, exclusions } = twoHouseholds(10);
        const seen = new Set();

        for (let i = 0; i < 500; i++) {
            const result = generateAssignments(participants, exclusions);
            seen.add(result.find(a => a.giver === householdA[0]).receiver);
        }

        expect(seen).toEqual(new Set(householdB));
    });
});
