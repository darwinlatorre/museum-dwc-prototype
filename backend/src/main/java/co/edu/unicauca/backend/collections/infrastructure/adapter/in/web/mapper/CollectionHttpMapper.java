package co.edu.unicauca.backend.collections.infrastructure.adapter.in.web.mapper;

import org.mapstruct.Mapper;
import co.edu.unicauca.backend.shared.infrastructure.mapping.BackendMapperConfig;
import co.edu.unicauca.backend.collections.application.port.in.CollectionCommands;
import co.edu.unicauca.backend.collections.domain.model.CollectionModel.Info;
import co.edu.unicauca.backend.collections.domain.model.CollectionModel.Record;
import co.edu.unicauca.backend.collections.domain.model.CollectionModel.Receipt;
import co.edu.unicauca.backend.collections.domain.model.CollectionModel.Row;
import co.edu.unicauca.backend.collections.domain.model.CollectionModel.Issue;
import co.edu.unicauca.backend.collections.infrastructure.adapter.in.web.dto.req.CollectionRequests;
import co.edu.unicauca.backend.collections.infrastructure.adapter.in.web.dto.res.CollectionResponses;

@Mapper(config = BackendMapperConfig.class)
public interface CollectionHttpMapper {
    CollectionCommands.Import command(CollectionRequests.ImportRequest source);
    CollectionCommands.Add command(CollectionRequests.AddRequest source);
    CollectionCommands.Edit command(CollectionRequests.EditRequest source);
    CollectionCommands.Restore command(CollectionRequests.RestoreRequest source);
    Row row(CollectionRequests.RowRequest source);
    CollectionResponses.InfoResponse info(Info source);
    CollectionResponses.RecordResponse record(Record source);
    CollectionResponses.ImportResponse receipt(Receipt source);
    CollectionResponses.IssueResponse issue(Issue source);
}
