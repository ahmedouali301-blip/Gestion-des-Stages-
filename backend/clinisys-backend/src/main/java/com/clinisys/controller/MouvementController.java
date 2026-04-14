package com.clinisys.controller;

import com.clinisys.entity.Mouvement;
import com.clinisys.service.MouvementService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import java.util.List;

@RestController
@RequestMapping("/api/mouvements")
@RequiredArgsConstructor
public class MouvementController {

    private final MouvementService mouvementService;

    @GetMapping
    @PreAuthorize("hasAnyAuthority('ROLE_RESPONSABLE_STAGE', 'ROLE_ADMINISTRATEUR')")
    public List<Mouvement> getAll() {
        return mouvementService.getAll();
    }
}
