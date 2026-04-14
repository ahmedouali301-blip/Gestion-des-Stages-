package com.clinisys.service;

import com.clinisys.entity.Mouvement;
import com.clinisys.entity.Utilisateur;
import com.clinisys.repository.MouvementRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import java.util.List;

@Service
@RequiredArgsConstructor
public class MouvementService {

    private final MouvementRepository mouvementRepository;

    public void enregistrer(String description, String typeAction, Utilisateur utilisateur) {
        Mouvement m = new Mouvement();
        m.setDescription(description);
        m.setTypeAction(typeAction);
        m.setUtilisateur(utilisateur);
        mouvementRepository.save(m);
    }

    public List<Mouvement> getAll() {
        return mouvementRepository.findAllByOrderByDateActionDesc();
    }
}
