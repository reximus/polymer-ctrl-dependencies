// npm i
/* eslint-disable no-console */
const { Analyzer, FsUrlLoader, PackageUrlResolver } = require( 'polymer-analyzer' );

const ExpectingParams = 5;
if (process.argv.length !== ExpectingParams) {
  console.log('Usage:   node deps <projectPath> <PathToRootPolymerElement> <PolymerElementId>');
  console.log('Example: node deps c:\\my-project src\\app.html paper-button');
  process.exit( -1 );
}

const [, , projectPath, relativePathToRootPolymerElement, polymerElementId] = process.argv;
console.log( `Got projectPath='${projectPath}' pathToRootPolymerElement='${relativePathToRootPolymerElement}' polymerElementId='${ polymerElementId }'` );
// const rootDir = process.cwd();

const analyzer = new Analyzer( {
  urlLoader : new FsUrlLoader( projectPath ),
  urlResolver : new PackageUrlResolver( { packageDir : projectPath } ),
} );

const uniqueBy = ( arr = [], getPropValFun ) => Object.values(
  arr.reduce( ( acc, i ) => {
    acc[getPropValFun( i )] = i;
    return acc;
  }, {} )
);

const createRefCtrl = ( id, lvl, url, refTo ) => ( { id, lvl, url, refTo } );

const fillRefElements = ( elementName, lvl = 0, analysisCtx, processedCtrls ) => {
  // console.log( `${ elementName } - ${ lvl }` );
  const elems = analysisCtx.getFeatures( {
    id : elementName,
    imported : true,
    excludeBackreferences : false,
    kind : 'element-reference',
  } );

  const refCtrlIdMap = uniqueBy(
    Array.from( elems ).map( ( el ) => el.sourceRange ),
    ( sr ) => sr.file
  )
    .map( ( sr ) => analysisCtx.getDocumentContaining( sr ) )
    .reduce( ( acc, doc ) => {
      const [domModule] = doc._getByKind
        ? Array.from( doc._getByKind( 'dom-module' ) )
        : [];
      if ( domModule ) {
        acc[domModule.id] = createRefCtrl( domModule.id, lvl, doc.url, elementName );
      }
      return acc;
    }, {} );

  const nonProcessedCtrlIds = Object.keys( refCtrlIdMap ).filter( ( ctrlId ) => !processedCtrls[ctrlId] );
  Object.assign( processedCtrls, refCtrlIdMap );
  nonProcessedCtrlIds.forEach( ( ctrlId ) => fillRefElements( ctrlId, lvl + 1, analysisCtx, processedCtrls ) );
};

const fillJsonBranch = ( ctrlId, allRefCtrls, jsonContainer = {} ) => {
  const refCtrlIds = allRefCtrls.filter( ( ctrl ) => ctrl.refTo === ctrlId ).map( ( ctrl ) => ctrl.id );
  if ( !refCtrlIds.length ) {
    jsonContainer[ctrlId] = {};
  } else {
    jsonContainer[ctrlId] = refCtrlIds.reduce( ( acc, id ) => {
      return fillJsonBranch( id, allRefCtrls, acc );
    }, {} );
  }
  return jsonContainer;
};

const notifyStep = (txt) => console.log( `====== ${txt} ======` );
notifyStep('Initing anslysis context...');
analyzer.analyze( [relativePathToRootPolymerElement] ).then( ( analysisCtx ) => {
  notifyStep('Anslysis complete. Collecting dependencies...');
  const lvl = 0;
  const processedCtrls = { [polymerElementId] : createRefCtrl( polymerElementId, lvl ) };
  fillRefElements( polymerElementId, lvl + 1, analysisCtx, processedCtrls );
  const json = fillJsonBranch( polymerElementId, Object.values( processedCtrls ) );

  notifyStep( 'Result JSON:' );
  console.log( JSON.stringify( json ) );
  notifyStep( 'Done' );
  console.log( 'May use this data in https://vanya.jp.net/vtree/ to visualize.' );
} );
