package co.edu.unicauca.backend.collections.infrastructure.adapter.in.web.mapper;

import org.mapstruct.Mapper;
import co.edu.unicauca.backend.shared.infrastructure.mapping.BackendMapperConfig;
import co.edu.unicauca.backend.collections.application.port.in.CollectionCommands;
import co.edu.unicauca.backend.collections.domain.model.CollectionModel.Info;
import co.edu.unicauca.backend.collections.domain.model.CollectionModel.Record;
import co.edu.unicauca.backend.collections.domain.model.CollectionModel.Receipt;
import co.edu.unicauca.backend.collections.domain.model.CollectionModel.Row;
import co.edu.unicauca.backend.collections.domain.model.CollectionModel.Issue;
import co.edu.unicauca.backend.collections.infrastructure.adapter.in.web.dto.req.AddRequest;
import co.edu.unicauca.backend.collections.infrastructure.adapter.in.web.dto.req.EditRequest;
import co.edu.unicauca.backend.collections.infrastructure.adapter.in.web.dto.req.ImportRequest;
import co.edu.unicauca.backend.collections.infrastructure.adapter.in.web.dto.req.RestoreRequest;
import co.edu.unicauca.backend.collections.infrastructure.adapter.in.web.dto.req.RowRequest;
import co.edu.unicauca.backend.collections.infrastructure.adapter.in.web.dto.res.ImportResponse;
import co.edu.unicauca.backend.collections.infrastructure.adapter.in.web.dto.res.InfoResponse;
import co.edu.unicauca.backend.collections.infrastructure.adapter.in.web.dto.res.IssueResponse;
import co.edu.unicauca.backend.collections.infrastructure.adapter.in.web.dto.res.RecordResponse;

@Mapper(config = BackendMapperConfig.class)
public interface CollectionHttpMapper {
    CollectionCommands.Import command(ImportRequest source);
    CollectionCommands.Add command(AddRequest source);
    CollectionCommands.Edit command(EditRequest source);
    CollectionCommands.Restore command(RestoreRequest source);
    Row row(RowRequest source);
    InfoResponse info(Info source);
    RecordResponse record(Record source);
    ImportResponse receipt(Receipt source);
    IssueResponse issue(Issue source);
}
