/** Contrato L3 simulado: solo pruebas, nunca valores de respaldo productivos. */
export const contextKeys = ['collection', 'permit', 'sampling', 'marine', 'other'] as const;
const base = ['occurrenceID', 'basisOfRecord', 'institutionCode', 'type', 'institutionID', 'country', 'scientificName', 'taxonRank'];
export const requiredSets = {
  collection: ['occurrenceID', 'basisOfRecord', 'institutionCode', 'collectionCode', 'type', 'catalogNumber', 'institutionID', 'collectionID', 'country', 'scientificName', 'taxonRank', 'recordedBy', 'eventDate', 'year', 'month', 'day', 'stateProvince', 'county', 'locality', 'minimumElevationInMeters', 'decimalLatitude', 'decimalLongitude', 'identifiedBy', 'order', 'superfamily', 'family', 'subfamily', 'tribe', 'subtribe', 'genus'],
  permit: [...base, 'individualCount', 'organismQuantity', 'organismQuantityType', 'recordedBy', 'preparations', 'disposition', 'eventDate', 'stateProvince', 'county', 'locality', 'minimumElevationInMeters', 'decimalLatitude', 'decimalLongitude', 'geodeticDatum'],
  sampling: [...base, 'eventID', 'eventDate'],
  marine: [...base, 'occurrenceStatus', 'eventID', 'eventDate', 'locality', 'decimalLatitude', 'decimalLongitude', 'scientificNameID'],
  other: [...base],
};
export const configurationFixture = (fields?: string[]) => ({ revision: 7, contexts: contextKeys.map(context => ({ context, requiredFields: [...(fields ?? requiredSets[context])] })) });
