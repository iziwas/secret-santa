import React, { useState } from 'react';
import * as XLSX from 'xlsx';
import { Upload, AlertCircle } from 'lucide-react';

export default function SecretSantaApp() {
    const [participants, setParticipants] = useState([]);
    const [exclusions, setExclusions] = useState({});
    const [assignments, setAssignments] = useState([]);
    const [error, setError] = useState('');
    const [newParticipant, setNewParticipant] = useState('');
    const [selectedGiver, setSelectedGiver] = useState('');
    const [selectedReceiver, setSelectedReceiver] = useState('');
    const [activeTab, setActiveTab] = useState('participants');

    const addParticipant = () => {
        const name = newParticipant.trim();
        if (!name) return;
        if (participants.includes(name)) {
            setError('Ce participant existe déjà.');
            return;
        }
        setParticipants([...participants, name]);
        setNewParticipant('');
        setError('');
    };

    const removeParticipant = (name) => {
        setParticipants(participants.filter(p => p !== name));
        // Nettoyer les exclusions liées
        const newExclusions = { ...exclusions };
        delete newExclusions[name];
        Object.keys(newExclusions).forEach(key => {
            newExclusions[key] = newExclusions[key].filter(e => e !== name);
            if (newExclusions[key].length === 0) {
                delete newExclusions[key];
            }
        });
        setExclusions(newExclusions);
        setAssignments([]);
    };

    const addExclusion = () => {
        if (!selectedGiver || !selectedReceiver) return;
        if (selectedGiver === selectedReceiver) {
            setError('Une personne ne peut pas s\'exclure elle-même.');
            return;
        }

        const newExclusions = { ...exclusions };
        if (!newExclusions[selectedGiver]) {
            newExclusions[selectedGiver] = [];
        }
        if (newExclusions[selectedGiver].includes(selectedReceiver)) {
            setError('Cette exclusion existe déjà.');
            return;
        }
        newExclusions[selectedGiver].push(selectedReceiver);
        setExclusions(newExclusions);
        setSelectedGiver('');
        setSelectedReceiver('');
        setError('');
        setAssignments([]);
    };

    const removeExclusion = (giver, receiver) => {
        const newExclusions = { ...exclusions };
        newExclusions[giver] = newExclusions[giver].filter(r => r !== receiver);
        if (newExclusions[giver].length === 0) {
            delete newExclusions[giver];
        }
        setExclusions(newExclusions);
        setAssignments([]);
    };

    const handleFileUpload = (e) => {
        const file = e.target.files[0];
        if (!file) return;

        // Validation du fichier
        const maxFileSize = 5 * 1024 * 1024; // 5MB
        if (file.size > maxFileSize) {
            setError('Le fichier est trop volumineux (max 5MB)');
            return;
        }

        const reader = new FileReader();
        reader.onload = (event) => {
            try {
                const data = new Uint8Array(event.target.result);
                // Utiliser defval pour éviter les injections de propriétés
                const workbook = XLSX.read(data, { type: 'array', defval: '' });

                // Validation des onglets
                if (!workbook.SheetNames || workbook.SheetNames.length < 2) {
                    setError('Le fichier doit contenir au moins 2 onglets.');
                    return;
                }

                // Lecture du premier onglet (participants)
                const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
                const participantsData = XLSX.utils.sheet_to_json(firstSheet, { header: 1, defval: '' });
                const participantsList = participantsData
                    .slice(1)
                    .map(row => String(row[0] || '').trim())
                    .filter(name => name && name.length > 0 && name.length <= 100);

                if (participantsList.length === 0) {
                    setError('Aucun participant valide trouvé. Vérifie l\'onglet 1.');
                    return;
                }

                // Lecture du deuxième onglet (exclusions)
                const secondSheet = workbook.Sheets[workbook.SheetNames[1]];
                const exclusionsData = XLSX.utils.sheet_to_json(secondSheet, { header: 1, defval: '' });

                const exclusionsMap = {};
                for (let i = 1; i < exclusionsData.length; i++) {
                    const giver = String(exclusionsData[i][0] || '').trim();
                    const excluded = String(exclusionsData[i][1] || '').trim();
                    if (giver && excluded && giver.length <= 100 && excluded.length <= 100) {
                        if (!exclusionsMap[giver]) {
                            exclusionsMap[giver] = [];
                        }
                        if (!exclusionsMap[giver].includes(excluded)) {
                            exclusionsMap[giver].push(excluded);
                        }
                    }
                }

                setParticipants(participantsList);
                setExclusions(exclusionsMap);
                setAssignments([]);
                setError('');
            } catch {
                setError('Erreur lors de la lecture du fichier Excel. Vérifiez le format.');
            }
        };
        reader.readAsArrayBuffer(file);
    };

    const shuffleArray = (array) => {
        const shuffled = [...array];
        for (let i = shuffled.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
        }
        return shuffled;
    };

    const generateSecretSanta = () => {
        if (participants.length < 2) {
            setError('Il faut au moins 2 participants.');
            return;
        }

        let attempts = 0;
        const maxAttempts = 1000;

        while (attempts < maxAttempts) {
            const givers = [...participants];
            const receivers = shuffleArray([...participants]);
            const result = [];
            let valid = true;

            for (let i = 0; i < givers.length; i++) {
                const giver = givers[i];
                const receiver = receivers[i];

                // Vérifier qu'on ne donne pas à soi-même
                if (giver === receiver) {
                    valid = false;
                    break;
                }

                // Vérifier les exclusions
                if (exclusions[giver] && exclusions[giver].includes(receiver)) {
                    valid = false;
                    break;
                }

                result.push({ giver, receiver });
            }

            if (valid) {
                setAssignments(result);
                setError('');
                return;
            }

            attempts++;
        }

        setError('Impossible de générer un Secret Santa valide avec ces exclusions. Essayez de réduire les exclusions.');
    };

    const downloadResults = () => {
        const ws = XLSX.utils.json_to_sheet(
            assignments.map(a => ({
                'Donneur': a.giver,
                'Receveur': a.receiver
            }))
        );
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, 'Résultats');
        XLSX.writeFile(wb, 'secret_santa_resultats.xlsx');
    };



    const exclusionCount = Object.values(exclusions).flat().length;
    const ready = participants.length >= 2;

    return (
        <div className="min-h-screen bg-canvas">

            {/* En-tête : le résumé chiffré avant le détail. */}
            <header className="border-b border-line bg-panel">
                <div className="mx-auto flex max-w-3xl flex-wrap items-baseline justify-between gap-x-8 gap-y-2 px-6 py-4">
                    <h1 className="text-base font-semibold tracking-tight text-text">
                        Secret Santa
                    </h1>
                    <dl className="flex items-baseline gap-6 text-sm">
                        <div className="flex items-baseline gap-2">
                            <dt className="text-muted">Participants</dt>
                            <dd className="tnum font-mono font-medium text-text">{participants.length}</dd>
                        </div>
                        <div className="flex items-baseline gap-2">
                            <dt className="text-muted">Exclusions</dt>
                            <dd className="tnum font-mono font-medium text-text">{exclusionCount}</dd>
                        </div>
                    </dl>
                </div>
            </header>

            <main className="mx-auto max-w-3xl px-6 py-8">
                <p className="mb-6 text-sm text-muted">
                    Attribution aléatoire des participants, en respectant les exclusions définies.
                </p>

                {/* Import */}
                <label className="group flex cursor-pointer items-center gap-3 rounded-panel border border-dashed border-line-strong bg-panel px-4 py-3 transition-colors hover:border-accent hover:bg-accent-wash">
                    <Upload className="h-4 w-4 shrink-0 text-faint transition-colors group-hover:text-accent" />
                    <span className="text-sm">
                        <span className="font-medium text-text">Importer un fichier Excel</span>
                        <span className="ml-2 text-muted">
                            onglet 1 : participants · onglet 2 : exclusions
                        </span>
                    </span>
                    <input
                        type="file"
                        className="hidden"
                        accept=".xlsx,.xls"
                        onChange={handleFileUpload}
                    />
                </label>

                {error && (
                    <div
                        role="alert"
                        className="mt-4 flex items-start gap-2 rounded-panel border border-danger/25 bg-danger-wash px-4 py-3"
                    >
                        <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-danger" />
                        <p className="text-sm text-danger">{error}</p>
                    </div>
                )}

                {/* Panneau principal */}
                <section className="mt-6 rounded-panel border border-line bg-panel">
                    <div className="flex border-b border-line">
                        {[
                            { id: 'participants', label: 'Participants', count: participants.length },
                            { id: 'exclusions', label: 'Exclusions', count: exclusionCount },
                        ].map(tab => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                aria-current={activeTab === tab.id}
                                className={`-mb-px border-b-2 px-4 py-2.5 text-sm transition-colors ${
                                    activeTab === tab.id
                                        ? 'border-accent font-medium text-text'
                                        : 'border-transparent text-muted hover:text-text'
                                }`}
                            >
                                {tab.label}
                                <span className="tnum ml-2 font-mono text-xs text-muted">{tab.count}</span>
                            </button>
                        ))}
                    </div>

                    {/* Participants */}
                    {activeTab === 'participants' && (
                        <div>
                            {participants.length === 0 ? (
                                <p className="px-4 py-6 text-sm text-muted">
                                    Aucun participant. Importez un fichier ou saisissez les noms ci-dessous.
                                </p>
                            ) : (
                                <ul className="max-h-80 divide-y divide-line overflow-y-auto">
                                    {participants.map((p, i) => (
                                        <li key={i} className="flex items-center gap-3 px-4 py-2">
                                            <span className="tnum w-6 shrink-0 font-mono text-xs text-muted">
                                                {String(i + 1).padStart(2, '0')}
                                            </span>
                                            <span className="flex-1 truncate text-sm text-text">{p}</span>
                                            <button
                                                onClick={() => removeParticipant(p)}
                                                aria-label={`Retirer ${p}`}
                                                className="shrink-0 text-xs text-muted transition-colors hover:text-danger"
                                            >
                                                Retirer
                                            </button>
                                        </li>
                                    ))}
                                </ul>
                            )}

                            <div className="flex gap-2 border-t border-line bg-canvas px-4 py-3">
                                <input
                                    type="text"
                                    value={newParticipant}
                                    onChange={(e) => setNewParticipant(e.target.value)}
                                    onKeyDown={(e) => e.key === 'Enter' && addParticipant()}
                                    placeholder="Nom du participant"
                                    className="flex-1 rounded-panel border border-line bg-panel px-3 py-1.5 text-sm text-text placeholder:text-faint focus:border-accent focus:outline-none"
                                />
                                <button
                                    onClick={addParticipant}
                                    className="shrink-0 rounded-panel border border-line-strong bg-panel px-3 py-1.5 text-sm font-medium text-text transition-colors hover:border-accent hover:text-accent"
                                >
                                    Ajouter
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Exclusions */}
                    {activeTab === 'exclusions' && (
                        <div>
                            {exclusionCount === 0 ? (
                                <p className="px-4 py-6 text-sm text-muted">
                                    Aucune exclusion. Tout le monde peut offrir à tout le monde.
                                </p>
                            ) : (
                                <ul className="max-h-80 divide-y divide-line overflow-y-auto">
                                    {Object.entries(exclusions).map(([giver, receivers]) =>
                                        receivers.map((receiver, i) => (
                                            <li
                                                key={`${giver}-${receiver}-${i}`}
                                                className="flex items-center gap-3 px-4 py-2"
                                            >
                                                <span className="flex-1 truncate text-sm text-text">
                                                    {giver}
                                                    <span className="mx-2 text-danger" aria-hidden="true">✕</span>
                                                    {receiver}
                                                </span>
                                                <button
                                                    onClick={() => removeExclusion(giver, receiver)}
                                                    aria-label={`Retirer l’exclusion ${giver} vers ${receiver}`}
                                                    className="shrink-0 text-xs text-muted transition-colors hover:text-danger"
                                                >
                                                    Retirer
                                                </button>
                                            </li>
                                        ))
                                    )}
                                </ul>
                            )}

                            {participants.length > 1 ? (
                                <div className="flex flex-wrap items-end gap-2 border-t border-line bg-canvas px-4 py-3">
                                    <label className="min-w-36 flex-1">
                                        <span className="mb-1 block text-xs font-medium tracking-wide text-muted">
                                            Cette personne
                                        </span>
                                        <select
                                            value={selectedGiver}
                                            onChange={(e) => setSelectedGiver(e.target.value)}
                                            className="w-full rounded-panel border border-line bg-panel px-3 py-1.5 text-sm text-text focus:border-accent focus:outline-none"
                                        >
                                            <option value="">Choisir…</option>
                                            {participants.map((p, i) => (
                                                <option key={i} value={p}>{p}</option>
                                            ))}
                                        </select>
                                    </label>
                                    <label className="min-w-36 flex-1">
                                        <span className="mb-1 block text-xs font-medium tracking-wide text-muted">
                                            N’offre pas à
                                        </span>
                                        <select
                                            value={selectedReceiver}
                                            onChange={(e) => setSelectedReceiver(e.target.value)}
                                            className="w-full rounded-panel border border-line bg-panel px-3 py-1.5 text-sm text-text focus:border-accent focus:outline-none"
                                        >
                                            <option value="">Choisir…</option>
                                            {participants.map((p, i) => (
                                                <option key={i} value={p}>{p}</option>
                                            ))}
                                        </select>
                                    </label>
                                    <button
                                        onClick={addExclusion}
                                        disabled={!selectedGiver || !selectedReceiver}
                                        className="shrink-0 rounded-panel border border-line-strong bg-panel px-3 py-1.5 text-sm font-medium text-text transition-colors hover:border-accent hover:text-accent disabled:border-line disabled:text-faint"
                                    >
                                        Ajouter
                                    </button>
                                </div>
                            ) : (
                                <p className="border-t border-line bg-canvas px-4 py-3 text-xs text-muted">
                                    Ajoutez au moins deux participants pour définir une exclusion.
                                </p>
                            )}
                        </div>
                    )}
                </section>

                <div className="mt-6 flex flex-wrap items-center gap-4">
                    <button
                        onClick={generateSecretSanta}
                        disabled={!ready}
                        className="rounded-panel bg-accent px-5 py-2 text-sm font-medium text-white transition-colors hover:bg-accent-hover disabled:cursor-not-allowed disabled:bg-line-strong"
                    >
                        Lancer le tirage
                    </button>
                    {!ready && (
                        <span className="text-xs text-muted">Deux participants minimum.</span>
                    )}
                </div>

                {/* Résultats */}
                {assignments.length > 0 && (
                    <section className="mt-8 rounded-panel border border-line bg-panel">
                        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line px-4 py-3">
                            <h2 className="text-sm font-semibold text-text">
                                Tirage
                                <span className="tnum ml-2 font-mono text-xs font-normal text-muted">
                                    {assignments.length} attributions
                                </span>
                            </h2>
                            <button
                                onClick={downloadResults}
                                className="rounded-panel border border-line-strong px-3 py-1.5 text-xs font-medium text-text transition-colors hover:border-accent hover:text-accent"
                            >
                                Exporter en Excel
                            </button>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="border-b border-line text-left text-xs font-medium text-muted">
                                        <th scope="col" className="w-10 px-4 py-2 font-medium">#</th>
                                        <th scope="col" className="whitespace-nowrap px-2 py-2 pr-10 font-medium">Offre un cadeau</th>
                                        <th scope="col" className="w-full px-2 py-2 font-medium">À</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-line">
                                    {assignments.map((assignment, i) => (
                                        <tr key={i}>
                                            <td className="tnum px-4 py-2 font-mono text-xs text-muted">
                                                {String(i + 1).padStart(2, '0')}
                                            </td>
                                            <td className="whitespace-nowrap px-2 py-2 pr-10 text-text">{assignment.giver}</td>
                                            <td className="px-2 py-2 font-medium text-text">{assignment.receiver}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </section>
                )}

                <footer className="mt-10 border-t border-line pt-4 text-xs leading-relaxed text-muted">
                    <p className="mb-1 font-medium text-text">Format du fichier attendu</p>
                    <p>Onglet 1 — colonne A, en-tête « Nom », puis un participant par ligne.</p>
                    <p>
                        Onglet 2 — colonnes A et B, en-têtes « Donneur » et « Ne peut pas offrir à »,
                        puis une exclusion par ligne.
                    </p>
                </footer>
            </main>
        </div>
    );
}
