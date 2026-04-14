-- Base de donnÃ©es pour Gestion communication Encadrant-Stagiaire

CREATE TABLE utilisateurs (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    nom VARCHAR(100),
    prenom VARCHAR(100),
    email VARCHAR(150) UNIQUE NOT NULL,
    mot_de_passe VARCHAR(255) NOT NULL,
    telephone VARCHAR(20),
    actif BOOLEAN DEFAULT TRUE,
    date_creation DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE administrateurs (
    id BIGINT PRIMARY KEY,
    FOREIGN KEY (id) REFERENCES utilisateurs(id) ON DELETE CASCADE
);

CREATE TABLE responsables_stage (
    id BIGINT PRIMARY KEY,
    departement VARCHAR(150),
    FOREIGN KEY (id) REFERENCES utilisateurs(id) ON DELETE CASCADE
);

CREATE TABLE encadrants (
    id BIGINT PRIMARY KEY,
    specialite VARCHAR(150),
    nb_stagiaires_max INT,
    FOREIGN KEY (id) REFERENCES utilisateurs(id) ON DELETE CASCADE
);

CREATE TABLE stagiaires (
    id BIGINT PRIMARY KEY,
    cin VARCHAR(20) UNIQUE,
    universite VARCHAR(150),
    specialite VARCHAR(150),
    niveau_etude VARCHAR(50),
    date_debut DATE,
    date_fin DATE,
    statut VARCHAR(50) DEFAULT 'EN_ATTENTE',
    FOREIGN KEY (id) REFERENCES utilisateurs(id) ON DELETE CASCADE
);

CREATE TABLE projets (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    titre VARCHAR(255) NOT NULL,
    description TEXT,
    technologies VARCHAR(255),
    date_creation DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE stages (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    sujet VARCHAR(255) NOT NULL,
    description TEXT,
    date_debut DATE,
    date_fin DATE,
    type VARCHAR(50),
    statut VARCHAR(50) DEFAULT 'EN_ATTENTE',
    projet_id BIGINT,
    responsable_id BIGINT,
    encadrant_id BIGINT,
    stagiaire_id BIGINT UNIQUE,
    FOREIGN KEY (projet_id) REFERENCES projets(id) ON DELETE SET NULL,
    FOREIGN KEY (responsable_id) REFERENCES responsables_stage(id) ON DELETE SET NULL,
    FOREIGN KEY (encadrant_id) REFERENCES encadrants(id) ON DELETE SET NULL,
    FOREIGN KEY (stagiaire_id) REFERENCES stagiaires(id) ON DELETE CASCADE
);

CREATE TABLE sprints (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    numero INT NOT NULL,
    nom VARCHAR(255),
    objectifs TEXT,
    date_debut DATE,
    date_fin DATE,
    date_cloture DATE,
    taux_avancement DOUBLE DEFAULT 0.0,
    livrables TEXT,
    statut VARCHAR(50) DEFAULT 'PLANIFIE',
    projet_id BIGINT,
    FOREIGN KEY (projet_id) REFERENCES projets(id) ON DELETE CASCADE
);

CREATE TABLE taches (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    titre VARCHAR(255) NOT NULL,
    description TEXT,
    priorite VARCHAR(20) DEFAULT 'MOYENNE',
    date_creation DATETIME DEFAULT CURRENT_TIMESTAMP,
    date_echeance DATE,
    stage_id BIGINT,
    encadrant_id BIGINT,
    stagiaire_id BIGINT,
    FOREIGN KEY (stage_id) REFERENCES stages(id) ON DELETE CASCADE,
    FOREIGN KEY (encadrant_id) REFERENCES encadrants(id) ON DELETE SET NULL,
    FOREIGN KEY (stagiaire_id) REFERENCES stagiaires(id) ON DELETE SET NULL
);

CREATE TABLE tache_sprint (
    sprint_id BIGINT NOT NULL,
    tache_id BIGINT NOT NULL,
    statut VARCHAR(50) DEFAULT 'A_FAIRE',
    duree INT,
    date_debut DATE,
    date_fin DATE,
    estimation INT,
    commentaire TEXT,
    PRIMARY KEY (sprint_id, tache_id),
    FOREIGN KEY (sprint_id) REFERENCES sprints(id) ON DELETE CASCADE,
    FOREIGN KEY (tache_id) REFERENCES taches(id) ON DELETE CASCADE
);

CREATE TABLE reunions (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    titre VARCHAR(255) NOT NULL,
    date_proposee DATETIME,
    date_finale DATETIME,
    lieu VARCHAR(255),
    statut VARCHAR(50) DEFAULT 'EN_ATTENTE',
    ordre_jour TEXT,
    encadrant_id BIGINT,
    stagiaire_id BIGINT,
    FOREIGN KEY (encadrant_id) REFERENCES encadrants(id) ON DELETE CASCADE,
    FOREIGN KEY (stagiaire_id) REFERENCES stagiaires(id) ON DELETE CASCADE
);

CREATE TABLE proces_verbaux (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    date_redaction DATETIME DEFAULT CURRENT_TIMESTAMP,
    observations TEXT,
    decisions TEXT,
    actions_correctives TEXT,
    contenu TEXT,
    reunion_id BIGINT UNIQUE NOT NULL,
    FOREIGN KEY (reunion_id) REFERENCES reunions(id) ON DELETE CASCADE
);

CREATE TABLE evaluations (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    date_evaluation DATETIME DEFAULT CURRENT_TIMESTAMP,
    commentaire_global TEXT,
    note_finale DOUBLE,
    encadrant_id BIGINT,
    stagiaire_id BIGINT,
    sprint_id BIGINT,
    FOREIGN KEY (encadrant_id) REFERENCES encadrants(id) ON DELETE CASCADE,
    FOREIGN KEY (stagiaire_id) REFERENCES stagiaires(id) ON DELETE CASCADE,
    FOREIGN KEY (sprint_id) REFERENCES sprints(id) ON DELETE CASCADE
);

CREATE TABLE criteres_evaluation (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    nom VARCHAR(255) NOT NULL,
    note DOUBLE,
    ponderation DOUBLE,
    commentaire TEXT,
    evaluation_id BIGINT NOT NULL,
    FOREIGN KEY (evaluation_id) REFERENCES evaluations(id) ON DELETE CASCADE
);

CREATE TABLE notifications (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    message TEXT NOT NULL,
    lue BOOLEAN DEFAULT FALSE,
    date_envoi DATETIME DEFAULT CURRENT_TIMESTAMP,
    utilisateur_id BIGINT NOT NULL,
    FOREIGN KEY (utilisateur_id) REFERENCES utilisateurs(id) ON DELETE CASCADE
);