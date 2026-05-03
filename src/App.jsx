import React, { useState } from 'react';
import * as XLSX from 'xlsx';
import { Gift, Upload, Users, AlertCircle } from 'lucide-react';
import './App.css';

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
            } catch (err) {
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

    return (
        <div className="min-h-screen bg-gradient-to-br from-red-50 via-green-50 to-red-50 p-8">
            <div className="max-w-4xl mx-auto">
                <div className="text-center mb-8">
                    <div className="flex items-center justify-center gap-3 mb-3">
                        <Gift className="w-12 h-12 text-red-600" />
                        <h1 className="text-4xl font-bold text-gray-800">Secret Santa</h1>
                    </div>
                    <p className="text-gray-600">Importez votre fichier Excel et générez les attributions</p>
                </div>

                <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
                    <div className="mb-6">
                        <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-red-500 transition-colors">
                            <div className="flex flex-col items-center justify-center pt-5 pb-6">
                                <Upload className="w-10 h-10 mb-3 text-gray-400" />
                                <p className="mb-2 text-sm text-gray-500">
                                    <span className="font-semibold">Cliquez pour importer</span> votre fichier Excel
                                </p>
                                <p className="text-xs text-gray-400">Onglet 1: Participants | Onglet 2: Exclusions</p>
                            </div>
                            <input
                                type="file"
                                className="hidden"
                                accept=".xlsx,.xls"
                                onChange={handleFileUpload}
                            />
                        </label>
                    </div>

                    {error && (
                        <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
                            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                            <p className="text-red-800 text-sm">{error}</p>
                        </div>
                    )}

                    {/* Onglets */}
                    {participants.length > 0 && (
                        <div className="mb-6">
                            <div className="flex border-b border-gray-200 mb-4">
                                <button
                                    onClick={() => setActiveTab('participants')}
                                    className={`px-6 py-3 font-semibold transition-colors ${
                                        activeTab === 'participants'
                                            ? 'text-green-600 border-b-2 border-green-600'
                                            : 'text-gray-500 hover:text-gray-700'
                                    }`}
                                >
                                    <div className="flex items-center gap-2">
                                        <Users className="w-5 h-5" />
                                        Participants ({participants.length})
                                    </div>
                                </button>
                                <button
                                    onClick={() => setActiveTab('exclusions')}
                                    className={`px-6 py-3 font-semibold transition-colors ${
                                        activeTab === 'exclusions'
                                            ? 'text-red-600 border-b-2 border-red-600'
                                            : 'text-gray-500 hover:text-gray-700'
                                    }`}
                                >
                                    <div className="flex items-center gap-2">
                                        <AlertCircle className="w-5 h-5" />
                                        Exclusions ({Object.values(exclusions).flat().length})
                                    </div>
                                </button>
                            </div>

                            {/* Contenu de l'onglet Participants */}
                            {activeTab === 'participants' && (
                                <div>
                                    <div className="bg-gray-50 rounded p-4 max-h-96 overflow-y-auto mb-4">
                                        {participants.length === 0 ? (
                                            <p className="text-center text-gray-500 py-8">Aucun participant</p>
                                        ) : (
                                            <div className="space-y-2">
                                                {participants.map((p, i) => (
                                                    <div key={i} className="flex items-center justify-between bg-white px-4 py-3 rounded-lg border border-gray-200 hover:border-green-300 transition-colors">
                                                        <span className="text-gray-800 font-medium">{p}</span>
                                                        <button
                                                            onClick={() => removeParticipant(p)}
                                                            className="text-red-600 hover:text-red-800 text-sm font-semibold px-3 py-1 rounded hover:bg-red-50 transition-colors"
                                                        >
                                                            Supprimer
                                                        </button>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>

                                    {/* Ajouter un participant */}
                                    <div className="flex gap-2">
                                        <input
                                            type="text"
                                            value={newParticipant}
                                            onChange={(e) => setNewParticipant(e.target.value)}
                                            onKeyPress={(e) => e.key === 'Enter' && addParticipant()}
                                            placeholder="Nom du participant..."
                                            className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                                        />
                                        <button
                                            onClick={addParticipant}
                                            className="bg-green-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-green-700 transition-colors whitespace-nowrap"
                                        >
                                            + Ajouter
                                        </button>
                                    </div>
                                </div>
                            )}

                            {/* Contenu de l'onglet Exclusions */}
                            {activeTab === 'exclusions' && (
                                <div>
                                    {/* Liste des exclusions existantes */}
                                    <div className="bg-gray-50 rounded p-4 mb-4 max-h-96 overflow-y-auto">
                                        {Object.keys(exclusions).length === 0 ? (
                                            <p className="text-center text-gray-500 py-8">Aucune exclusion définie</p>
                                        ) : (
                                            <div className="space-y-2">
                                                {Object.entries(exclusions).map(([giver, receivers]) =>
                                                        receivers.map((receiver, i) => (
                                                            <div key={`${giver}-${receiver}-${i}`} className="flex items-center justify-between bg-white px-4 py-3 rounded-lg border border-gray-200 hover:border-red-300 transition-colors">
                              <span className="text-sm text-gray-800">
                                <span className="font-semibold">{giver}</span>
                                <span className="mx-2 text-red-600">→ ✗</span>
                                <span className="font-semibold">{receiver}</span>
                              </span>
                                                                <button
                                                                    onClick={() => removeExclusion(giver, receiver)}
                                                                    className="text-red-600 hover:text-red-800 text-sm font-semibold px-3 py-1 rounded hover:bg-red-50 transition-colors"
                                                                >
                                                                    Supprimer
                                                                </button>
                                                            </div>
                                                        ))
                                                )}
                                            </div>
                                        )}
                                    </div>

                                    {/* Ajouter une exclusion */}
                                    {participants.length > 1 && (
                                        <div className="space-y-3">
                                            <p className="text-sm text-gray-600 font-medium">Ajouter une exclusion :</p>
                                            <div className="flex gap-2 items-end">
                                                <div className="flex-1">
                                                    <label className="block text-sm text-gray-600 mb-1">Donneur</label>
                                                    <select
                                                        value={selectedGiver}
                                                        onChange={(e) => setSelectedGiver(e.target.value)}
                                                        className="w-full px-3 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                                                    >
                                                        <option value="">Sélectionner...</option>
                                                        {participants.map((p, i) => (
                                                            <option key={i} value={p}>{p}</option>
                                                        ))}
                                                    </select>
                                                </div>
                                                <div className="flex-1">
                                                    <label className="block text-sm text-gray-600 mb-1">Ne peut pas offrir à</label>
                                                    <select
                                                        value={selectedReceiver}
                                                        onChange={(e) => setSelectedReceiver(e.target.value)}
                                                        className="w-full px-3 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                                                    >
                                                        <option value="">Sélectionner...</option>
                                                        {participants.map((p, i) => (
                                                            <option key={i} value={p}>{p}</option>
                                                        ))}
                                                    </select>
                                                </div>
                                                <button
                                                    onClick={addExclusion}
                                                    disabled={!selectedGiver || !selectedReceiver}
                                                    className="bg-red-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-red-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors whitespace-nowrap"
                                                >
                                                    + Ajouter
                                                </button>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    )}

                    <button
                        onClick={generateSecretSanta}
                        disabled={participants.length < 2}
                        className="w-full bg-red-600 text-white py-3 rounded-lg font-semibold hover:bg-red-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
                    >
                        🎄 Générer le Secret Santa
                    </button>
                </div>

                {assignments.length > 0 && (
                    <div className="bg-white rounded-lg shadow-lg p-6">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-xl font-bold text-gray-800">Résultats</h3>
                            <button
                                onClick={downloadResults}
                                className="bg-green-600 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-green-700 transition-colors"
                            >
                                Télécharger Excel
                            </button>
                        </div>
                        <div className="space-y-3">
                            {assignments.map((assignment, i) => (
                                <div key={i} className="bg-gradient-to-r from-red-50 to-green-50 p-4 rounded-lg border border-gray-200">
                                    <p className="text-gray-800">
                                        <span className="font-semibold">{assignment.giver}</span>
                                        <span className="mx-3 text-red-600">→</span>
                                        offre un cadeau à
                                        <span className="mx-3 text-red-600">→</span>
                                        <span className="font-semibold">{assignment.receiver}</span>
                                    </p>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <h4 className="font-semibold text-blue-900 mb-2">Format du fichier Excel :</h4>
                    <ul className="text-sm text-blue-800 space-y-1">
                        <li><strong>Onglet 1 :</strong> Colonne A avec en-tête "Nom" puis la liste des participants</li>
                        <li><strong>Onglet 2 :</strong> Colonnes A et B avec en-têtes "Donneur" et "Ne peut pas offrir à" puis les exclusions</li>
                    </ul>
                </div>
            </div>
        </div>
    );
}